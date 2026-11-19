import type { AdminStatus, DataScope } from '../../types/admin'
import type { UserFixture } from './fixtures/users'

export function filterUsers(users: UserFixture[], options: { search?: string; status?: AdminStatus | 'all'; organizationId?: string | 'all'; source?: UserFixture['source'] | 'all' }): UserFixture[] {
  const search = options.search?.trim().toLowerCase() ?? ''
  return users.filter((user) => {
    const matchesSearch = !search || `${user.username} ${user.display_name} ${user.email} ${user.organization_name}`.toLowerCase().includes(search)
    const matchesStatus = !options.status || options.status === 'all' || user.status === options.status
    const matchesOrganization = !options.organizationId || options.organizationId === 'all' || user.organization_id === options.organizationId
    const matchesSource = !options.source || options.source === 'all' || user.source === options.source
    return matchesSearch && matchesStatus && matchesOrganization && matchesSource
  })
}

export function canDeactivateUser(user: UserFixture): { ok: true } | { ok: false; reason: 'self' | 'lastTenantAdmin' | 'alreadyInactive' } {
  if (user.status === 'inactive') return { ok: false, reason: 'alreadyInactive' }
  if (user.is_self) return { ok: false, reason: 'self' }
  if (user.is_last_tenant_admin) return { ok: false, reason: 'lastTenantAdmin' }
  return { ok: true }
}

export function summarizeUserRoles(user: UserFixture): string {
  return user.roles.map((role) => `${role.role_name} · ${role.scope}`).join('；')
}

export function hasTenantAdminRole(bindings: UserFixture['roles']): boolean {
  return bindings.some((binding) => binding.role_id === 'role_tenant_admin')
}

export function reconcileTenantAdminFlags(users: UserFixture[]): UserFixture[] {
  const activeTenantAdmins = users.filter((user) => user.status === 'active' && hasTenantAdminRole(user.roles))
  const lastTenantAdminId = activeTenantAdmins.length === 1 ? activeTenantAdmins[0]!.id : null
  return users.map((user) => ({ ...user, is_last_tenant_admin: user.id === lastTenantAdminId }))
}

export function canSaveRoleBindings(
  user: UserFixture,
  bindings: UserFixture['roles'],
  tenantAdminRoleId?: string,
): { ok: true } | { ok: false; reason: 'lastTenantAdminRole' } {
  if (user.status === 'active' && user.is_last_tenant_admin) {
    const tenantAdminBinding = tenantAdminRoleId
      ? bindings.find((binding) => binding.role_id === tenantAdminRoleId)
      : undefined
    if (!tenantAdminBinding || tenantAdminBinding.scope !== 'all') return { ok: false, reason: 'lastTenantAdminRole' }
  }
  return { ok: true }
}

export function effectivePermissions(user: UserFixture): string[] {
  return [...user.effective_permissions]
}

export function updateRoleBindingScope(bindings: UserFixture['roles'], roleId: string, scope: DataScope): UserFixture['roles'] {
  return bindings.map((binding) => binding.role_id === roleId ? { ...binding, scope } : binding)
}
