import type { AuthUser } from '../../api/auth'
import type { AuthPermission } from '../../services/auth/permissions'
import { hasPermission } from '../../services/auth/permissions'

export interface RouteAccessMeta {
  requiresAuth?: boolean
  requiresAdmin?: boolean
  permissions?: AuthPermission[]
}

export type RouteAccessDecision = 'allow' | 'login' | 'forbidden'

export function evaluateRouteAccess(meta: RouteAccessMeta, user: AuthUser | null): RouteAccessDecision {
  const requiresAuth = meta.requiresAuth === true
  const requiresAdmin = meta.requiresAdmin === true
  const permissions = Array.isArray(meta.permissions) ? meta.permissions : []
  if (!requiresAuth && !requiresAdmin && permissions.length === 0) return 'allow'
  if (!user) return 'login'
  if (requiresAdmin && !hasPermission(user, 'admin')) return 'forbidden'
  if (permissions.length > 0 && !permissions.every((permission) => hasPermission(user, permission))) return 'forbidden'
  return 'allow'
}
