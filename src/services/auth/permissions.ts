import type { AuthUser } from '../../api/auth'

export type AuthPermission = 'authenticated' | 'admin'

export function hasPermission(user: AuthUser | null, permission: AuthPermission): boolean {
  if (permission === 'authenticated') return Boolean(user)
  if (permission === 'admin') return user?.is_admin === true
  return false
}
