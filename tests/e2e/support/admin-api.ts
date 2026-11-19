import type { Page, Route } from '@playwright/test'
import type {
  AdminAnnouncement,
  AdminRole,
  AdminUser,
  AuditEvent,
  DictionaryEntry,
  DictionaryType,
  UserRoleBinding,
} from '../../../src/types/admin'
import type { Organization, OrganizationTreeNode } from '../../../src/api/organizations'
import { userFixtures } from '../../../src/modules/users/fixtures/users'
import { permissionGroups, roleFixtures } from '../../../src/modules/roles/fixtures/roles'
import { dictionaryEntryFixtures, dictionaryTypeFixtures } from '../../../src/modules/dictionaries/fixtures/dictionaries'
import { announcementFixtures } from '../../../src/modules/announcements/fixtures/announcements'
import { auditActionDefinitions, auditEventFixtures } from '../../../src/modules/audit-logs/fixtures/audit-events'
import { organizationFixtures } from '../../../src/modules/organizations/fixtures/organizations'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function paginate<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get('per_page') ?? 20)))
  return {
    items: items.slice((page - 1) * perPage, page * perPage),
    pagination: {
      page,
      per_page: perPage,
      total: items.length,
      total_pages: Math.ceil(items.length / perPage),
    },
  }
}

function matchesSearch(query: string | null, values: Array<string | null | undefined>): boolean {
  const normalized = query?.trim().toLowerCase()
  return !normalized || values.some((value) => String(value ?? '').toLowerCase().includes(normalized))
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'X-Request-Id': 'req_e2e_admin' },
    body: JSON.stringify(body),
  })
}

function badRequest(route: Route, message: string, code = 'ADMIN_VALIDATION_FAILED') {
  return json(route, 409, { code, message, request_id: 'req_e2e_admin_conflict' })
}

export async function mockAdminApi(page: Page) {
  await page.context().addCookies([{ name: 'XSRF-TOKEN', value: 'test-csrf-token', url: 'http://127.0.0.1:4183' }])

  const state = {
    users: clone(userFixtures),
    roles: clone(roleFixtures),
    dictionaryTypes: clone(dictionaryTypeFixtures),
    dictionaryEntries: clone(dictionaryEntryFixtures),
    announcements: clone(announcementFixtures),
    auditEvents: clone(auditEventFixtures),
    organizations: clone(organizationFixtures),
    sequence: 100,
  }

  const now = () => '2026-11-18T08:00:00Z'
  const nextId = (prefix: string) => `${prefix}_${state.sequence++}`
  const roleById = (id: string) => state.roles.find((role) => role.id === id)
  const organizationById = (id: string) => state.organizations.find((organization) => organization.id === id)

  function organizationNodes(parentId: string | null, organizations: Organization[]): OrganizationTreeNode[] {
    return organizations
      .filter((organization) => organization.parent_id === parentId)
      .sort((left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at))
      .map((organization) => ({
        ...organization,
        children: organizationNodes(organization.id, organizations),
      }))
  }

  async function requireOrganizationVersion(route: Route, organization: Organization): Promise<boolean> {
    const ifMatch = route.request().headers()['if-match']
    if (ifMatch === `"${organization.version}"`) return true
    await json(route, 412, {
      code: 'ORG_VERSION_CONFLICT',
      message: 'Organization version conflict',
      request_id: 'req_e2e_org_version',
    })
    return false
  }

  async function requireIdempotencyKey(route: Route): Promise<boolean> {
    if (route.request().headers()['idempotency-key']) return true
    await json(route, 428, {
      code: 'PRECONDITION_REQUIRED',
      message: 'Idempotency-Key is required',
      request_id: 'req_e2e_org_idempotency',
    })
    return false
  }

  function refreshLastTenantAdmins() {
    const tenantAdminIds = new Set(state.roles.filter((role) => role.code === 'tenant_admin').map((role) => role.id))
    const active = state.users.filter((user) => user.status === 'active'
      && user.roles.some((binding) => tenantAdminIds.has(binding.role_id)))
    const lastId = active.length === 1 ? active[0]!.id : null
    state.users = state.users.map((user) => ({ ...user, is_last_tenant_admin: user.id === lastId }))
  }

  function effectivePermissions(bindings: UserRoleBinding[]): string[] {
    const roleIds = new Set(bindings.map((binding) => binding.role_id))
    return [...new Set(state.roles
      .filter((role) => role.status === 'active' && roleIds.has(role.id))
      .flatMap((role) => role.permissions))]
  }

  function userResponse(user: AdminUser): AdminUser {
    return {
      ...user,
      effective_permissions: user.status === 'active' ? effectivePermissions(user.roles) : [],
    }
  }

  await page.route((url) => url.pathname === '/api' || url.pathname.startsWith('/api/'), async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.slice('/api'.length) || '/'
    const method = request.method()

    if (path === '/users/me') {
      await route.fallback()
      return
    }

    if (path === '/organizations/tree' && method === 'GET') {
      const includeInactive = url.searchParams.get('include_inactive') === 'true'
      const source = includeInactive
        ? state.organizations
        : state.organizations.filter((organization) => organization.status === 'active')
      await json(route, 200, {
        items: organizationNodes(null, source),
        meta: {
          root_id: source.find((organization) => !organization.parent_id)?.id ?? null,
          include_inactive: includeInactive,
          max_depth: 4,
          truncated: false,
        },
      })
      return
    }

    if (path === '/organizations' && method === 'GET') {
      const status = url.searchParams.get('status')
      const type = url.searchParams.get('type')
      const filtered = state.organizations.filter((organization) => (!status || organization.status === status)
        && (!type || organization.type === type)
        && matchesSearch(url.searchParams.get('search'), [organization.code, organization.name]))
      await json(route, 200, paginate(filtered, url))
      return
    }

    if (path === '/organizations' && method === 'POST') {
      if (!await requireIdempotencyKey(route)) return
      const body = request.postDataJSON() as {
        parent_id: string
        code: string
        name: string
        type: Organization['type']
        sort_order: number
        leader_user_id?: string | null
        description?: string | null
      }
      const parent = organizationById(body.parent_id)
      if (!parent) {
        await json(route, 404, { code: 'ORG_PARENT_NOT_FOUND', message: 'Parent organization not found', request_id: 'req_e2e_admin' })
        return
      }
      if (parent.status !== 'active') {
        await badRequest(route, '不能在已停用机构下创建下级机构。', 'ORG_PARENT_INACTIVE')
        return
      }
      if (parent.depth >= 4) {
        await badRequest(route, '创建后会超过四级限制。', 'ORG_MAX_DEPTH_EXCEEDED')
        return
      }
      if (state.organizations.some((organization) => organization.code.toLowerCase() === body.code.toLowerCase())) {
        await badRequest(route, '机构编码已存在。', 'ORG_CODE_CONFLICT')
        return
      }
      const organization: Organization = {
        tenant_id: parent.tenant_id,
        id: nextId('org'),
        code: body.code,
        name: body.name,
        type: body.type,
        status: 'active',
        parent_id: parent.id,
        sort_order: body.sort_order,
        leader_user_id: body.leader_user_id ?? null,
        description: body.description ?? null,
        depth: parent.depth + 1,
        version: 1,
        created_at: now(),
        updated_at: now(),
        inactive_at: null,
      }
      state.organizations.push(organization)
      await json(route, 201, organization)
      return
    }

    const organizationMatch = path.match(/^\/organizations\/([^/]+)(?:\/(move|status))?$/)
    if (organizationMatch) {
      const organization = organizationById(decodeURIComponent(organizationMatch[1]!))
      if (!organization) {
        await json(route, 404, { code: 'ORG_NOT_FOUND', message: 'Organization not found', request_id: 'req_e2e_admin' })
        return
      }
      const action = organizationMatch[2]
      if (method === 'GET' && !action) {
        await json(route, 200, organization)
        return
      }
      if (method === 'PATCH' && !action) {
        if (!await requireOrganizationVersion(route, organization)) return
        const body = request.postDataJSON() as Partial<Pick<Organization, 'name' | 'type' | 'sort_order' | 'leader_user_id' | 'description'>>
        Object.assign(organization, body, { version: organization.version + 1, updated_at: now() })
        await json(route, 200, organization)
        return
      }
      if (method === 'POST' && action === 'move') {
        if (!await requireIdempotencyKey(route) || !await requireOrganizationVersion(route, organization)) return
        const body = request.postDataJSON() as { target_parent_id: string; sort_order: number }
        const target = organizationById(body.target_parent_id)
        if (!target) {
          await json(route, 404, { code: 'ORG_PARENT_NOT_FOUND', message: 'Target parent not found', request_id: 'req_e2e_admin' })
          return
        }
        if (target.status !== 'active') {
          await badRequest(route, '不能移动到已停用机构下。', 'ORG_PARENT_INACTIVE')
          return
        }
        if (!organization.parent_id) {
          await badRequest(route, '根机构不能移动。', 'ORG_ROOT_PROTECTED')
          return
        }
        const movingIds = new Set([organization.id])
        const pending = [organization.id]
        while (pending.length > 0) {
          const parentId = pending.pop()
          for (const candidate of state.organizations) {
            if (candidate.parent_id !== parentId || movingIds.has(candidate.id)) continue
            movingIds.add(candidate.id)
            pending.push(candidate.id)
          }
        }
        if (movingIds.has(target.id)) {
          await badRequest(route, '不能移动到自身或后代机构。', 'ORG_CYCLE')
          return
        }
        const depthDelta = target.depth + 1 - organization.depth
        if (target.depth + Math.max(...state.organizations.filter((candidate) => movingIds.has(candidate.id)).map((candidate) => candidate.depth)) - organization.depth + 1 > 4) {
          await badRequest(route, '移动后会超过四级限制。', 'ORG_MAX_DEPTH_EXCEEDED')
          return
        }
        for (const candidate of state.organizations) {
          if (!movingIds.has(candidate.id)) continue
          candidate.depth += depthDelta
          candidate.version += 1
          candidate.updated_at = now()
        }
        organization.parent_id = target.id
        organization.sort_order = body.sort_order
        await json(route, 200, organization)
        return
      }
      if (method === 'POST' && action === 'status') {
        if (!await requireIdempotencyKey(route) || !await requireOrganizationVersion(route, organization)) return
        const body = request.postDataJSON() as Pick<Organization, 'status'>
        if (body.status === 'inactive') {
          if (!organization.parent_id) {
            await badRequest(route, '根机构不能停用。', 'ORG_ROOT_PROTECTED')
            return
          }
          if (state.organizations.some((candidate) => candidate.parent_id === organization.id && candidate.status === 'active')) {
            await badRequest(route, '该机构存在启用中的直接子机构。', 'ORG_HAS_ACTIVE_CHILDREN')
            return
          }
        }
        organization.status = body.status
        organization.inactive_at = body.status === 'inactive' ? now() : null
        organization.version += 1
        organization.updated_at = now()
        await json(route, 200, organization)
        return
      }
    }

    if (path === '/roles/permissions' && method === 'GET') {
      await json(route, 200, { items: permissionGroups })
      return
    }

    if (path === '/roles' && method === 'GET') {
      const status = url.searchParams.get('status')
      const filtered = state.roles.filter((role) => (!status || role.status === status)
        && matchesSearch(url.searchParams.get('search'), [role.code, role.name, role.description]))
      await json(route, 200, paginate(filtered, url))
      return
    }

    if (path === '/roles' && method === 'POST') {
      const body = request.postDataJSON() as Pick<AdminRole, 'code' | 'name' | 'description' | 'scope' | 'permissions'>
      if (state.roles.some((role) => role.code === body.code)) {
        await badRequest(route, '角色编码已存在。', 'ROLE_CODE_CONFLICT')
        return
      }
      const role: AdminRole = {
        id: nextId('role'),
        code: body.code,
        name: body.name,
        description: body.description,
        scope: body.scope,
        permissions: body.permissions,
        builtin: false,
        status: 'active',
        user_count: 0,
        version: 1,
        updated_at: now(),
      }
      state.roles = [role, ...state.roles]
      await json(route, 201, role)
      return
    }

    const roleMatch = path.match(/^\/roles\/([^/]+)(?:\/(status))?$/)
    if (roleMatch) {
      const role = roleById(decodeURIComponent(roleMatch[1]!))
      if (!role) {
        await json(route, 404, { code: 'ROLE_NOT_FOUND', message: 'Role not found', request_id: 'req_e2e_admin' })
        return
      }
      if (method === 'GET' && !roleMatch[2]) {
        await json(route, 200, role)
        return
      }
      if (method === 'PATCH' && !roleMatch[2]) {
        const body = request.postDataJSON() as Pick<AdminRole, 'name' | 'description' | 'scope' | 'permissions'>
        Object.assign(role, body, { version: role.version + 1, updated_at: now() })
        await json(route, 200, role)
        return
      }
      if (method === 'PATCH' && roleMatch[2] === 'status') {
        const body = request.postDataJSON() as Pick<AdminRole, 'status'>
        Object.assign(role, body, { version: role.version + 1, updated_at: now() })
        await json(route, 200, role)
        return
      }
    }

    if (path === '/users' && method === 'GET') {
      const status = url.searchParams.get('status')
      const organizationId = url.searchParams.get('organization_id')
      const source = url.searchParams.get('source')
      const filtered = state.users.filter((user) => (!status || user.status === status)
        && (!organizationId || user.organization_id === organizationId)
        && (!source || user.source === source)
        && matchesSearch(url.searchParams.get('search'), [user.username, user.display_name, user.email, user.organization_name]))
      await json(route, 200, { ...paginate(filtered.map(userResponse), url) })
      return
    }

    if (path === '/users/invitations' && method === 'POST') {
      const body = request.postDataJSON() as {
        username: string
        display_name: string
        email: string
        organization_id: string
        roles: Array<Pick<UserRoleBinding, 'role_id' | 'scope'>>
      }
      if (state.users.some((user) => user.username === body.username || user.email.toLowerCase() === body.email.toLowerCase())) {
        await badRequest(route, '用户名或邮箱已存在。', 'USER_IDENTITY_CONFLICT')
        return
      }
      const organization = organizationById(body.organization_id)
      if (!organization) {
        await json(route, 404, { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found', request_id: 'req_e2e_admin' })
        return
      }
      const roles = body.roles.map((binding) => ({
        role_id: binding.role_id,
        role_name: roleById(binding.role_id)?.name ?? binding.role_id,
        scope: binding.scope,
      }))
      const user: AdminUser = {
        id: nextId('user'),
        username: body.username,
        display_name: body.display_name,
        email: body.email,
        organization_id: organization.id,
        organization_name: organization.name,
        status: 'active',
        source: 'local',
        roles,
        effective_permissions: effectivePermissions(roles),
        permissions_version: 1,
        last_login_at: null,
        updated_at: now(),
        version: 1,
        is_self: false,
        is_last_tenant_admin: false,
      }
      state.users.unshift(user)
      refreshLastTenantAdmins()
      await json(route, 201, userResponse(user))
      return
    }

    const userMatch = path.match(/^\/users\/([^/]+)(?:\/(role-bindings|status|credentials\/reset|sessions\/revoke))?$/)
    if (userMatch) {
      const user = state.users.find((candidate) => candidate.id === decodeURIComponent(userMatch[1]!))
      if (!user) {
        await json(route, 404, { code: 'USER_NOT_FOUND', message: 'User not found', request_id: 'req_e2e_admin' })
        return
      }
      const action = userMatch[2]
      if (method === 'GET' && !action) {
        await json(route, 200, userResponse(user))
        return
      }
      if (method === 'PATCH' && !action) {
        const body = request.postDataJSON() as { display_name: string; email: string; organization_id: string }
        const organization = organizationById(body.organization_id)
        if (!organization) {
          await json(route, 404, { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found', request_id: 'req_e2e_admin' })
          return
        }
        Object.assign(user, {
          display_name: body.display_name,
          email: body.email,
          organization_id: organization.id,
          organization_name: organization.name,
          version: user.version + 1,
          updated_at: now(),
        })
        await json(route, 200, userResponse(user))
        return
      }
      if (method === 'PUT' && action === 'role-bindings') {
        const body = request.postDataJSON() as { roles: Array<Pick<UserRoleBinding, 'role_id' | 'scope'>> }
        const nextRoles = body.roles.map((binding) => ({
          role_id: binding.role_id,
          role_name: roleById(binding.role_id)?.name ?? binding.role_id,
          scope: binding.scope,
        }))
        const tenantAdminRoleIds = new Set(state.roles.filter((role) => role.code === 'tenant_admin').map((role) => role.id))
        if (user.is_last_tenant_admin && !nextRoles.some((binding) => tenantAdminRoleIds.has(binding.role_id) && binding.scope === 'all')) {
          await badRequest(route, '不能移除最后一个租户管理员。', 'LAST_TENANT_ADMIN_REQUIRED')
          return
        }
        user.roles = nextRoles
        user.permissions_version += 1
        user.version += 1
        user.updated_at = now()
        refreshLastTenantAdmins()
        await json(route, 200, userResponse(user))
        return
      }
      if (method === 'PATCH' && action === 'status') {
        const body = request.postDataJSON() as Pick<AdminUser, 'status'>
        if (body.status === 'inactive' && (user.is_self || user.is_last_tenant_admin)) {
          await badRequest(route, user.is_self ? '不能停用当前登录用户。' : '不能停用最后一个租户管理员。', 'USER_STATUS_PROTECTED')
          return
        }
        user.status = body.status
        user.permissions_version += 1
        user.version += 1
        user.updated_at = now()
        refreshLastTenantAdmins()
        await json(route, 200, userResponse(user))
        return
      }
      if (method === 'POST' && action === 'credentials/reset') {
        await json(route, 200, userResponse(user))
        return
      }
      if (method === 'POST' && action === 'sessions/revoke') {
        await json(route, 200, userResponse(user))
        return
      }
    }

    if (path === '/dictionaries/types' && method === 'GET') {
      const status = url.searchParams.get('status')
      const filtered = state.dictionaryTypes.filter((type) => (!status || type.status === status)
        && matchesSearch(url.searchParams.get('search'), [type.code, type.name, type.description]))
        .map((type) => ({ ...type, entry_count: state.dictionaryEntries.filter((entry) => entry.type_id === type.id).length }))
      await json(route, 200, paginate(filtered, url))
      return
    }

    if (path === '/dictionaries/types' && method === 'POST') {
      const body = request.postDataJSON() as Pick<DictionaryType, 'code' | 'name' | 'description'>
      const type: DictionaryType = {
        id: nextId('dict'), code: body.code, name: body.name, description: body.description,
        entry_count: 0, status: 'active', version: 1, updated_at: now(),
      }
      state.dictionaryTypes.unshift(type)
      await json(route, 201, type)
      return
    }

    if (path === '/dictionaries/cache/refresh' && method === 'POST') {
      await json(route, 200, { refreshed_at: now() })
      return
    }

    const typeMatch = path.match(/^\/dictionaries\/types\/([^/]+)(?:\/(entries|status|default-entry))?$/)
    if (typeMatch) {
      const type = state.dictionaryTypes.find((candidate) => candidate.id === decodeURIComponent(typeMatch[1]!))
      if (!type) {
        await json(route, 404, { code: 'DICTIONARY_TYPE_NOT_FOUND', message: 'Dictionary type not found', request_id: 'req_e2e_admin' })
        return
      }
      const action = typeMatch[2]
      if (method === 'GET' && action === 'entries') {
        const entries = state.dictionaryEntries.filter((entry) => entry.type_id === type.id)
        await json(route, 200, paginate(entries, url))
        return
      }
      if (method === 'POST' && action === 'entries') {
        const body = request.postDataJSON() as Omit<DictionaryEntry, 'id' | 'type_id' | 'version' | 'updated_at' | 'status'>
        const entry: DictionaryEntry = {
          ...body,
          id: nextId('entry'),
          type_id: type.id,
          status: 'active',
          version: 1,
          updated_at: now(),
        }
        state.dictionaryEntries.push(entry)
        type.entry_count += 1
        await json(route, 201, entry)
        return
      }
      if (method === 'PATCH' && !action) {
        const body = request.postDataJSON() as Pick<DictionaryType, 'name' | 'description'>
        Object.assign(type, body, { version: type.version + 1, updated_at: now() })
        await json(route, 200, type)
        return
      }
      if (method === 'PATCH' && action === 'status') {
        const body = request.postDataJSON() as Pick<DictionaryType, 'status'>
        if (body.status === 'inactive' && state.dictionaryEntries.some((entry) => entry.type_id === type.id && entry.status === 'active')) {
          await badRequest(route, '该类型仍包含启用中的字典项，不能停用。', 'DICTIONARY_TYPE_HAS_ACTIVE_ENTRIES')
          return
        }
        Object.assign(type, body, { version: type.version + 1, updated_at: now() })
        await json(route, 200, type)
        return
      }
      if (method === 'POST' && action === 'default-entry') {
        const body = request.postDataJSON() as { entry_id: string }
        const target = state.dictionaryEntries.find((entry) => entry.type_id === type.id && entry.id === body.entry_id)
        if (!target) {
          await json(route, 404, { code: 'DICTIONARY_ENTRY_NOT_FOUND', message: 'Dictionary entry not found', request_id: 'req_e2e_admin' })
          return
        }
        for (const entry of state.dictionaryEntries) if (entry.type_id === type.id) entry.is_default = entry.id === target.id
        await json(route, 200, target)
        return
      }
    }

    const entryMatch = path.match(/^\/dictionaries\/entries\/([^/]+)(?:\/status)?$/)
    if (entryMatch) {
      const entry = state.dictionaryEntries.find((candidate) => candidate.id === decodeURIComponent(entryMatch[1]!))
      if (!entry) {
        await json(route, 404, { code: 'DICTIONARY_ENTRY_NOT_FOUND', message: 'Dictionary entry not found', request_id: 'req_e2e_admin' })
        return
      }
      if (method === 'PATCH' && path.endsWith('/status')) {
        const body = request.postDataJSON() as Pick<DictionaryEntry, 'status'>
        Object.assign(entry, body, { version: entry.version + 1, updated_at: now() })
      } else if (method === 'PATCH') {
        const body = request.postDataJSON() as Pick<DictionaryEntry, 'name' | 'description' | 'sort_order' | 'is_default'>
        Object.assign(entry, body, { version: entry.version + 1, updated_at: now() })
      }
      await json(route, 200, entry)
      return
    }

    if (path === '/announcements' && method === 'GET') {
      const status = url.searchParams.get('status')
      const filtered = state.announcements.filter((announcement) => (!status || announcement.status === status)
        && matchesSearch(url.searchParams.get('search'), [announcement.title, announcement.body, announcement.author]))
      await json(route, 200, paginate(filtered, url))
      return
    }

    if (path === '/announcements' && method === 'POST') {
      const body = request.postDataJSON() as Pick<AdminAnnouncement, 'title' | 'body' | 'audience'>
      const announcement: AdminAnnouncement = {
        id: nextId('ann'),
        title: body.title,
        body: body.body,
        audience: body.audience,
        status: 'draft',
        author: '当前管理员',
        scheduled_at: null,
        published_at: null,
        created_at: now(),
        updated_at: now(),
        version: 1,
        preview_snapshot: null,
      }
      state.announcements.unshift(announcement)
      await json(route, 201, announcement)
      return
    }

    const announcementMatch = path.match(/^\/announcements\/([^/]+)(?:\/(publish|schedule|withdraw|duplicate))?$/)
    if (announcementMatch) {
      const announcement = state.announcements.find((candidate) => candidate.id === decodeURIComponent(announcementMatch[1]!))
      if (!announcement) {
        await json(route, 404, { code: 'ANNOUNCEMENT_NOT_FOUND', message: 'Announcement not found', request_id: 'req_e2e_admin' })
        return
      }
      const action = announcementMatch[2]
      if (method === 'GET' && !action) {
        await json(route, 200, announcement)
        return
      }
      if (method === 'PATCH' && !action) {
        const body = request.postDataJSON() as Pick<AdminAnnouncement, 'title' | 'body' | 'audience'>
        if (!['draft'].includes(announcement.status)) {
          await badRequest(route, '已发布内容不可原地修改。', 'ANNOUNCEMENT_NOT_EDITABLE')
          return
        }
        Object.assign(announcement, body, { version: announcement.version + 1, updated_at: now() })
        await json(route, 200, announcement)
        return
      }
      if (method === 'POST' && action === 'publish') {
        Object.assign(announcement, {
          status: 'published', published_at: now(), version: announcement.version + 1, updated_at: now(),
          preview_snapshot: { generated_at: now(), title: announcement.title, body: announcement.body, audience_summary: '服务端受众快照' },
        })
        await json(route, 200, announcement)
        return
      }
      if (method === 'POST' && action === 'schedule') {
        const body = request.postDataJSON() as { scheduled_at: string }
        Object.assign(announcement, { status: 'scheduled', scheduled_at: body.scheduled_at, version: announcement.version + 1, updated_at: now() })
        await json(route, 200, announcement)
        return
      }
      if (method === 'POST' && action === 'withdraw') {
        Object.assign(announcement, { status: 'withdrawn', version: announcement.version + 1, updated_at: now() })
        await json(route, 200, announcement)
        return
      }
      if (method === 'POST' && action === 'duplicate') {
        const copy: AdminAnnouncement = {
          ...clone(announcement),
          id: nextId('ann'),
          title: `${announcement.title}（副本）`,
          status: 'draft',
          scheduled_at: null,
          published_at: null,
          created_at: now(),
          updated_at: now(),
          version: 1,
          preview_snapshot: null,
        }
        state.announcements.unshift(copy)
        await json(route, 201, copy)
        return
      }
    }

    if (path === '/audit/actions' && method === 'GET') {
      await json(route, 200, { items: auditActionDefinitions })
      return
    }

    if (path === '/audit/logs' && method === 'GET') {
      const action = url.searchParams.get('action')
      const result = url.searchParams.get('result')
      const from = url.searchParams.get('occurred_from')
      const to = url.searchParams.get('occurred_to')
      const events = state.auditEvents.filter((event) => (!action || event.action === action)
        && (!result || event.result === result)
        && (!from || Date.parse(event.occurred_at) >= Date.parse(from))
        && (!to || Date.parse(event.occurred_at) <= Date.parse(to))
        && matchesSearch(url.searchParams.get('search'), [event.actor_name, event.action, event.resource_name, event.request_id]))
      await json(route, 200, paginate(events, url))
      return
    }

    const auditMatch = path.match(/^\/audit\/logs\/([^/]+)$/)
    if (auditMatch && method === 'GET') {
      const event = state.auditEvents.find((candidate) => candidate.event_id === decodeURIComponent(auditMatch[1]!))
      if (!event) {
        await json(route, 404, { code: 'AUDIT_EVENT_NOT_FOUND', message: 'Audit event not found', request_id: 'req_e2e_admin' })
        return
      }
      const relatedIds = new Set(event.related_event_ids)
      const related = state.auditEvents.filter((candidate) => candidate.event_id !== event.event_id
        && (relatedIds.has(candidate.event_id) || candidate.request_id === event.request_id))
      await json(route, 200, { event, related_events: related })
      return
    }

    await route.fallback()
  })
}

export type AdminApiMockState = {
  users: AdminUser[]
  roles: AdminRole[]
  dictionaryTypes: DictionaryType[]
  dictionaryEntries: DictionaryEntry[]
  announcements: AdminAnnouncement[]
  auditEvents: AuditEvent[]
  organizations: Organization[]
}
