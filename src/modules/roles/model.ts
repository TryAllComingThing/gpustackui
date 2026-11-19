import type { DataScope } from '../../types/admin'
import type { PermissionGroup, RoleFixture } from './fixtures/roles'

export interface RoleDraft {
  name: string
  description: string
  scope: DataScope
  permissions: ReadonlySet<string>
}

export function permissionLabelKey(group: PermissionGroup, actionKey: string): string {
  return `page.roles.resources.${group.id}.${actionKey}`
}

export function permissionGroupState(group: PermissionGroup, selected: ReadonlySet<string>): 'all' | 'some' | 'none' {
  const count = group.permissions.filter((permission) => selected.has(permission.id)).length
  if (count === 0) return 'none'
  if (count === group.permissions.length) return 'all'
  return 'some'
}

export function togglePermissionGroup(group: PermissionGroup, selected: ReadonlySet<string>): Set<string> {
  const next = new Set(selected)
  const state = permissionGroupState(group, selected)
  for (const permission of group.permissions) {
    if (state === 'all') next.delete(permission.id)
    else next.add(permission.id)
  }
  return next
}

export function canEditRole(role: RoleFixture): boolean {
  return !role.builtin && role.status === 'active'
}

export function changedPermissionCount(role: RoleFixture, selected: ReadonlySet<string>): number {
  const original = new Set(role.permissions)
  let changes = selected.size + original.size
  for (const id of selected) if (original.has(id)) changes -= 2
  return changes
}

export function isRoleDraftDirty(role: RoleFixture, draft: RoleDraft): boolean {
  if (draft.name.trim() !== role.name || draft.description.trim() !== role.description || draft.scope !== role.scope) return true
  const original = new Set(role.permissions)
  if (draft.permissions.size !== original.size) return true
  return [...draft.permissions].some((permission) => !original.has(permission))
}

export function roleSearchMatches(role: RoleFixture, search: string): boolean {
  const query = search.trim().toLowerCase()
  return !query || `${role.name} ${role.code} ${role.description}`.toLowerCase().includes(query)
}
