import type { AuthUser } from '../../types/auth'

export type AuthPermission = 'authenticated' | 'admin'

export function hasPermission(user: AuthUser | null, permission: AuthPermission): boolean {
  if (!user || user.is_active !== true || user.require_password_change !== false) return false
  if (permission === 'authenticated') return true
  if (permission === 'admin') return user.is_admin === true
  return false
}
