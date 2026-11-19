import { describe, expect, it } from 'vitest'
import { canDeactivateUser, canSaveRoleBindings, effectivePermissions, filterUsers, reconcileTenantAdminFlags, summarizeUserRoles, updateRoleBindingScope } from '../../src/modules/users/model'
import { userFixtures } from '../../src/modules/users/fixtures/users'
import { canEditRole, changedPermissionCount, isRoleDraftDirty, permissionGroupState, roleSearchMatches, togglePermissionGroup } from '../../src/modules/roles/model'
import { permissionGroups, roleFixtures } from '../../src/modules/roles/fixtures/roles'
import {
  canDeactivateDictionaryEntry,
  canDeactivateDictionaryType,
  entriesForType,
  filterDictionaryTypes,
  normalizeDictionaryCode,
  setDefaultDictionaryEntry,
  validateDictionaryDefaultState,
} from '../../src/modules/dictionaries/model'
import { dictionaryEntryFixtures, dictionaryTypeFixtures } from '../../src/modules/dictionaries/fixtures/dictionaries'
import {
  availableAnnouncementActions,
  canTransitionAnnouncement,
  createAnnouncementPreview,
  duplicateAnnouncement,
  estimatedAudienceCount,
  filterAnnouncements,
  isAnnouncementAudienceEmpty,
  isAnnouncementEditable,
  normalizeAnnouncementAudience,
  toDateTimeLocalInput,
  validateAnnouncementContent,
  validateAnnouncementSchedule,
} from '../../src/modules/announcements/model'
import { announcementFixtures } from '../../src/modules/announcements/fixtures/announcements'
import { auditEventHref, displayAuditChange, filterAuditEvents, getAuditEvent, relatedAuditEvents } from '../../src/modules/audit-logs/model'
import { auditActionDefinitions, auditEventFixtures } from '../../src/modules/audit-logs/fixtures/audit-events'

describe('user management model', () => {
  it('filters users without changing the source collection', () => {
    expect(filterUsers(userFixtures, { search: '王芳' }).map((user) => user.id)).toEqual(['user_wang'])
    expect(filterUsers(userFixtures, { status: 'inactive' }).map((user) => user.id)).toEqual(['user_sun'])
    expect(filterUsers(userFixtures, { organizationId: 'org_platform', source: 'local' }).map((user) => user.id)).toEqual(['user_zhang'])
  })

  it('protects self and the last tenant administrator from deactivation', () => {
    expect(canDeactivateUser(userFixtures[0]!)).toEqual({ ok: false, reason: 'self' })
    const lastAdmin = { ...userFixtures[1]!, is_self: false, is_last_tenant_admin: true }
    expect(canDeactivateUser(lastAdmin)).toEqual({ ok: false, reason: 'lastTenantAdmin' })
    expect(canDeactivateUser({ ...lastAdmin, is_last_tenant_admin: false })).toEqual({ ok: true })
  })

  it('summarizes roles and updates one binding scope', () => {
    expect(summarizeUserRoles(userFixtures[1]!)).toContain('机构管理员')
    expect(updateRoleBindingScope(userFixtures[1]!.roles, 'role_org_admin', 'all')[0]?.scope).toBe('all')
    expect(effectivePermissions(userFixtures[2]!)).toContain('content:announcement:publish')
  })

  it('reconciles the last tenant administrator and blocks removing the protected role binding', () => {
    const activeAdmin = userFixtures[0]!
    const nonAdmin = userFixtures[1]!
    expect(canSaveRoleBindings(activeAdmin, [{ role_id: 'role_readonly', role_name: '只读管理员', scope: 'org' }], 'role_tenant_admin'))
      .toEqual({ ok: false, reason: 'lastTenantAdminRole' })
    expect(canSaveRoleBindings(activeAdmin, [{ role_id: 'role_tenant_admin', role_name: '租户管理员', scope: 'org' }], 'role_tenant_admin'))
      .toEqual({ ok: false, reason: 'lastTenantAdminRole' })
    expect(canSaveRoleBindings(activeAdmin, [{ role_id: 'role_tenant_admin', role_name: '租户管理员', scope: 'all' }], 'role_tenant_admin'))
      .toEqual({ ok: true })
    expect(canSaveRoleBindings(
      activeAdmin,
      [{ role_id: 'role_custom_root', role_name: '租户根管理员', scope: 'all' }],
      'role_custom_root',
    )).toEqual({ ok: true })
    const reconciled = reconcileTenantAdminFlags([activeAdmin, nonAdmin])
    expect(reconciled.find((user) => user.id === activeAdmin.id)?.is_last_tenant_admin).toBe(true)
    expect(reconciled.find((user) => user.id === nonAdmin.id)?.is_last_tenant_admin).toBe(false)
  })
})

describe('role and permission model', () => {
  const organizationGroup = permissionGroups.find((group) => group.id === 'organization')!

  it('toggles full permission groups and reports partial state', () => {
    const none = new Set<string>()
    expect(permissionGroupState(organizationGroup, none)).toBe('none')
    const all = togglePermissionGroup(organizationGroup, none)
    expect(permissionGroupState(organizationGroup, all)).toBe('all')
    const partial = new Set([...all].filter((id) => id !== organizationGroup.permissions[0]!.id))
    expect(permissionGroupState(organizationGroup, partial)).toBe('some')
    expect(togglePermissionGroup(organizationGroup, all).size).toBe(0)
  })

  it('keeps built-in roles protected and counts real permission changes', () => {
    const builtin = roleFixtures[0]!
    const custom = roleFixtures.find((role) => !role.builtin)!
    expect(canEditRole(builtin)).toBe(false)
    expect(canEditRole(custom)).toBe(true)
    expect(changedPermissionCount(custom, new Set([...custom.permissions, 'audit:log:read']))).toBe(1)
    expect(roleSearchMatches(custom, '公告')).toBe(true)
  })

  it('detects metadata-only role changes and normalizes draft comparisons', () => {
    const custom = roleFixtures.find((role) => !role.builtin)!
    expect(isRoleDraftDirty(custom, {
      name: custom.name,
      description: custom.description,
      scope: custom.scope,
      permissions: new Set(custom.permissions),
    })).toBe(false)
    expect(isRoleDraftDirty(custom, {
      name: `${custom.name}（更新）`,
      description: custom.description,
      scope: custom.scope,
      permissions: new Set(custom.permissions),
    })).toBe(true)
  })
})

describe('dictionary model', () => {
  it('filters types and sorts entries by explicit order', () => {
    expect(filterDictionaryTypes(dictionaryTypeFixtures, '环境类型', 'active').map((type) => type.id)).toEqual(['dict_environment'])
    expect(entriesForType(dictionaryEntryFixtures, 'dict_task_status').map((entry) => entry.code)).toEqual(['queued', 'running', 'completed', 'failed'])
  })

  it('blocks unsafe deactivation and maintains exactly one default entry per type', () => {
    expect(canDeactivateDictionaryType(dictionaryEntryFixtures, 'dict_task_status')).toEqual({ ok: false, reason: 'activeEntries' })
    const defaultEntry = dictionaryEntryFixtures.find((entry) => entry.id === 'entry_running')!
    expect(canDeactivateDictionaryEntry(defaultEntry, dictionaryEntryFixtures)).toEqual({ ok: false, reason: 'defaultEntry' })
    expect(canDeactivateDictionaryEntry({ ...defaultEntry, is_default: false }, dictionaryEntryFixtures)).toEqual({ ok: true })
    expect(canDeactivateDictionaryEntry(defaultEntry, [defaultEntry])).toEqual({ ok: true })
    expect(validateDictionaryDefaultState('inactive', true)).toEqual({ ok: false, reason: 'inactiveDefault' })
    expect(validateDictionaryDefaultState('active', true)).toEqual({ ok: true })
    const updated = setDefaultDictionaryEntry(dictionaryEntryFixtures, 'dict_task_status', 'entry_completed')
    expect(updated.filter((entry) => entry.type_id === 'dict_task_status' && entry.is_default).map((entry) => entry.id)).toEqual(['entry_completed'])
  })

  it('normalizes dictionary codes', () => {
    expect(normalizeDictionaryCode(' Task Status ')).toBe('task_status')
  })
})

describe('announcement lifecycle model', () => {
  const draft = announcementFixtures[0]!

  it('allows only the documented lifecycle transitions', () => {
    expect(canTransitionAnnouncement('draft', 'published')).toBe(true)
    expect(canTransitionAnnouncement('draft', 'withdrawn')).toBe(false)
    expect(canTransitionAnnouncement('scheduled', 'published')).toBe(true)
    expect(canTransitionAnnouncement('scheduled', 'expired')).toBe(true)
    expect(canTransitionAnnouncement('published', 'withdrawn')).toBe(true)
    expect(canTransitionAnnouncement('withdrawn', 'published')).toBe(false)
    expect(isAnnouncementEditable('draft')).toBe(true)
    expect(isAnnouncementEditable('published')).toBe(false)
    expect(availableAnnouncementActions('published')).toContain('duplicate')
  })

  it('filters, previews, duplicates, and estimates combined audience rules', () => {
    expect(filterAnnouncements(announcementFixtures, { status: 'published' }).map((announcement) => announcement.id)).toEqual(['ann_model_release'])
    const snapshot = createAnnouncementPreview(draft, '平台研发部 · 内容编辑', '2026-11-15T00:00:00Z')
    expect(snapshot).toMatchObject({ title: draft.title, audience_summary: '平台研发部 · 内容编辑' })
    const copy = duplicateAnnouncement(draft, 'ann_copy', '（副本）', '2026-11-15T00:00:00Z')
    expect(copy).toMatchObject({ id: 'ann_copy', status: 'draft', version: 1, scheduled_at: null })
    expect(copy.title).toContain('（副本）')
    expect(estimatedAudienceCount({ all: false, organization_ids: ['org_hq'], role_codes: ['auditor'] })).toBe(23)
  })

  it('normalizes audience rules and blocks incomplete publish or schedule inputs', () => {
    expect(normalizeAnnouncementAudience({ all: true, organization_ids: ['org_hq'], role_codes: ['auditor'] }))
      .toEqual({ all: true, organization_ids: [], role_codes: [] })
    expect(isAnnouncementAudienceEmpty({ all: false, organization_ids: [], role_codes: [] })).toBe(true)
    expect(validateAnnouncementContent({ title: '标题', body: '', audience: { all: false, organization_ids: [], role_codes: [] } }))
      .toEqual({ ok: true })
    expect(validateAnnouncementContent(
      { title: '标题', body: '', audience: { all: false, organization_ids: [], role_codes: [] } },
      { requireBodyAndAudience: true },
    )).toEqual({ ok: false, reason: 'bodyRequired' })
    expect(validateAnnouncementSchedule('2026-11-15T00:00', new Date('2026-11-16T00:00:00Z')))
      .toEqual({ ok: false, reason: 'pastSchedule' })
    const utc = '2026-11-18T01:00:00Z'
    expect(new Date(toDateTimeLocalInput(utc)).toISOString()).toBe('2026-11-18T01:00:00.000Z')
    const copy = duplicateAnnouncement(draft, 'ann_copy_audience', '（副本）')
    expect(copy.audience).not.toBe(draft.audience)
    expect(copy.audience.organization_ids).not.toBe(draft.audience.organization_ids)
  })
})

describe('audit log model', () => {
  it('filters by result, action, search, and UTC date range', () => {
    expect(filterAuditEvents(auditEventFixtures, { result: 'failure' }).map((event) => event.event_id)).toEqual(['evt_20261115_007'])
    expect(filterAuditEvents(auditEventFixtures, { action: 'announcement.published' }).map((event) => event.event_id)).toEqual(['evt_20261115_005'])
    expect(filterAuditEvents(auditEventFixtures, { search: 'req_7f5c91a2' }).map((event) => event.event_id)).toEqual(['evt_20261115_001', 'evt_20261115_002'])
    expect(filterAuditEvents(auditEventFixtures, { from: '2026-11-15', to: '2026-11-15' })).toHaveLength(7)
  })

  it('resolves details, related request events, masked values, and stable links', () => {
    const event = getAuditEvent(auditEventFixtures, 'evt_20261115_001')!
    expect(relatedAuditEvents(auditEventFixtures, event).map((candidate) => candidate.event_id)).toEqual(['evt_20261115_002'])
    expect(displayAuditChange(event.changes[0]!)).toBe('active → inactive')
    const masked = auditEventFixtures.find((candidate) => candidate.event_id === 'evt_20261115_007')!
    expect(displayAuditChange(masked.changes[0]!)).toBe('[已脱敏]')
    expect(auditEventHref('evt/001')).toBe('/audit/logs/evt%2F001')
  })

  it('offers an action filter entry for every fixture action', () => {
    const optionValues = new Set(auditActionDefinitions.map((option) => option.value))
    for (const event of auditEventFixtures) expect(optionValues.has(event.action)).toBe(true)
  })
})
