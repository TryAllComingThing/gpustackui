import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/services/http', () => ({
  requestValidated: vi.fn(),
}))

import { requestValidated } from '../../src/services/http'
import {
  inviteUser,
  listAdminUsers,
  updateUserProfile,
  updateUserRoleBindings,
  updateUserStatus,
} from '../../src/api/users'
import { updateAdminRoleStatus } from '../../src/api/roles'
import {
  refreshDictionaryCache,
  updateDictionaryEntry,
  updateDictionaryEntryStatus,
} from '../../src/api/dictionaries'
import {
  publishAnnouncement,
  scheduleAnnouncement,
  withdrawAnnouncement,
} from '../../src/api/announcements'
import { listAuditEvents } from '../../src/api/audit-logs'

function lastRequest() {
  return vi.mocked(requestValidated).mock.calls.at(-1)?.[0]
}

describe('admin API transport contract', () => {
  beforeEach(() => {
    vi.mocked(requestValidated).mockReset().mockResolvedValue({ ok: true, data: {} })
  })

  it('loads users with server-side paging and snake_case filters only', async () => {
    await listAdminUsers({
      page: 2,
      perPage: 50,
      search: 'Platform',
      status: 'active',
      organizationId: 'org_platform',
      source: 'sso',
      sortBy: 'display_name',
      sortOrder: 'asc',
    })

    expect(lastRequest()).toEqual({
      method: 'GET',
      url: '/users',
      params: {
        page: 2,
        per_page: 50,
        search: 'Platform',
        status: 'active',
        organization_id: 'org_platform',
        source: 'sso',
        sort_by: 'display_name',
        sort_order: 'asc',
      },
    })
    expect(lastRequest()?.params).not.toHaveProperty('tenant_id')
    expect(lastRequest()?.params).not.toHaveProperty('scope')
  })

  it('uses version preconditions for profile and status writes', async () => {
    await updateUserProfile('user/01', {
      displayName: 'Platform Admin',
      email: 'platform@example.com',
      organizationId: 'org_platform',
    }, { version: 7 })
    expect(lastRequest()).toEqual({
      method: 'PATCH',
      url: '/users/user%2F01',
      data: {
        display_name: 'Platform Admin',
        email: 'platform@example.com',
        organization_id: 'org_platform',
      },
      headers: { 'If-Match': '"7"' },
    })

    await updateUserStatus('user_01', { status: 'inactive' }, {
      version: 8,
      idempotencyKey: 'idem-status-0001',
    })
    expect(lastRequest()).toEqual({
      method: 'PATCH',
      url: '/users/user_01/status',
      data: { status: 'inactive' },
      headers: { 'If-Match': '"8"', 'Idempotency-Key': 'idem-status-0001' },
    })
  })

  it('sends role bindings by ID and scope without trusting a client role name', async () => {
    await updateUserRoleBindings('user_01', {
      roles: [{ role_id: 'role_org_admin', scope: 'org_subtree' }],
    }, { version: 5, idempotencyKey: 'idem-roles-0001' })

    expect(lastRequest()).toEqual({
      method: 'PUT',
      url: '/users/user_01/role-bindings',
      data: { roles: [{ role_id: 'role_org_admin', scope: 'org_subtree' }] },
      headers: { 'If-Match': '"5"', 'Idempotency-Key': 'idem-roles-0001' },
    })
    expect(JSON.stringify(lastRequest()?.data)).not.toContain('role_name')
  })

  it('invites users and refreshes dictionary caches with idempotency keys', async () => {
    await inviteUser({
      username: 'new.viewer',
      displayName: 'New Viewer',
      email: 'new.viewer@example.com',
      organizationId: 'org_platform',
      roles: [{ role_id: 'role_readonly', scope: 'org' }],
    }, { idempotencyKey: 'idem-invite-0001' })

    expect(lastRequest()).toEqual({
      method: 'POST',
      url: '/users/invitations',
      data: {
        username: 'new.viewer',
        display_name: 'New Viewer',
        email: 'new.viewer@example.com',
        organization_id: 'org_platform',
        roles: [{ role_id: 'role_readonly', scope: 'org' }],
      },
      headers: { 'Idempotency-Key': 'idem-invite-0001' },
    })
    expect(JSON.stringify(lastRequest()?.data)).not.toContain('role_name')

    await refreshDictionaryCache('dict_01', 'idem-cache-0001')
    expect(lastRequest()).toEqual({
      method: 'POST',
      url: '/dictionaries/cache/refresh',
      data: { type_id: 'dict_01' },
      headers: { 'Idempotency-Key': 'idem-cache-0001' },
    })
  })

  it('updates dictionary content without accepting immutable entry codes', async () => {
    await updateDictionaryEntry('entry_01', {
      name: 'Running',
      description: 'Task is running.',
      sort_order: 20,
      is_default: true,
    }, { version: 3 })

    expect(lastRequest()).toEqual({
      method: 'PATCH',
      url: '/dictionaries/entries/entry_01',
      data: {
        name: 'Running',
        description: 'Task is running.',
        sort_order: 20,
        is_default: true,
      },
      headers: { 'If-Match': '"3"' },
    })
    expect(lastRequest()?.data).not.toHaveProperty('code')
    expect(lastRequest()?.data).not.toHaveProperty('type_id')

    await updateDictionaryEntryStatus('entry_01', { status: 'inactive' }, {
      version: 4,
      idempotencyKey: 'idem-entry-status',
    })
    expect(lastRequest()).toEqual({
      method: 'PATCH',
      url: '/dictionaries/entries/entry_01/status',
      data: { status: 'inactive' },
      headers: { 'If-Match': '"4"', 'Idempotency-Key': 'idem-entry-status' },
    })
  })

  it('guards role status and announcement lifecycle writes with version and idempotency', async () => {
    await updateAdminRoleStatus('role_01', { status: 'inactive' }, {
      version: 6,
      idempotencyKey: 'idem-role-status',
    })
    expect(lastRequest()).toEqual({
      method: 'PATCH',
      url: '/roles/role_01/status',
      data: { status: 'inactive' },
      headers: { 'If-Match': '"6"', 'Idempotency-Key': 'idem-role-status' },
    })

    await publishAnnouncement('ann_01', { version: 2, idempotencyKey: 'idem-publish-01' })
    expect(lastRequest()).toEqual({
      method: 'POST',
      url: '/announcements/ann_01/publish',
      headers: { 'If-Match': '"2"', 'Idempotency-Key': 'idem-publish-01' },
    })

    await scheduleAnnouncement('ann_01', '2026-12-01T01:00:00Z', {
      version: 3,
      idempotencyKey: 'idem-schedule-01',
    })
    expect(lastRequest()).toEqual({
      method: 'POST',
      url: '/announcements/ann_01/schedule',
      data: { scheduled_at: '2026-12-01T01:00:00Z' },
      headers: { 'If-Match': '"3"', 'Idempotency-Key': 'idem-schedule-01' },
    })

    await withdrawAnnouncement('ann_01', { version: 4, idempotencyKey: 'idem-withdraw-01' })
    expect(lastRequest()).toEqual({
      method: 'POST',
      url: '/announcements/ann_01/withdraw',
      headers: { 'If-Match': '"4"', 'Idempotency-Key': 'idem-withdraw-01' },
    })
  })

  it('sends audit date bounds as UTC API parameters without tenant or scope overrides', async () => {
    await listAuditEvents({
      page: 3,
      perPage: 20,
      search: 'org',
      action: 'organization.status_changed',
      result: 'success',
      occurredFrom: '2026-11-15T00:00:00Z',
      occurredTo: '2026-11-15T23:59:59Z',
    })

    expect(lastRequest()).toEqual({
      method: 'GET',
      url: '/audit/logs',
      params: {
        page: 3,
        per_page: 20,
        search: 'org',
        action: 'organization.status_changed',
        result: 'success',
        occurred_from: '2026-11-15T00:00:00Z',
        occurred_to: '2026-11-15T23:59:59Z',
      },
    })
    expect(lastRequest()?.params).not.toHaveProperty('tenant_id')
    expect(lastRequest()?.params).not.toHaveProperty('scope')
  })

  it('fails closed before transport for invalid filters, versions, or forged role fields', async () => {
    await expect(listAdminUsers({ perPage: 101 })).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    await expect(updateUserProfile('user_01', {
      displayName: 'Admin',
      email: 'admin@example.com',
      organizationId: 'org_hq',
    }, { version: 0 })).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    await expect(updateUserRoleBindings('user_01', {
      roles: [{ role_id: 'role_org_admin', role_name: 'Forged', scope: 'all' }],
    } as never, { version: 1, idempotencyKey: 'idem-roles-0002' })).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    expect(requestValidated).not.toHaveBeenCalled()
  })
})
