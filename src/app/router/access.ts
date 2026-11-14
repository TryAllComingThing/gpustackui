import type { AuthUser } from '../../types/auth'
import type { AuthPermission } from '../../services/auth/permissions'
import { hasPermission } from '../../services/auth/permissions'

export interface RouteAccessMeta {
  public?: boolean
  requiresAuth?: boolean
  requiresAdmin?: boolean
  permissions?: AuthPermission[]
  guestOnly?: boolean
  layout?: 'app' | 'auth'
}

export type RouteAccessDecision = 'allow' | 'login' | 'forbidden'

export function evaluateRouteAccess(meta: RouteAccessMeta, user: AuthUser | null): RouteAccessDecision {
  const requiresAuth = meta.requiresAuth === true
  const requiresAdmin = meta.requiresAdmin === true
  const permissions = Array.isArray(meta.permissions) ? meta.permissions : []
  const hasProtection = requiresAuth || requiresAdmin || permissions.length > 0
  if (meta.public === true) return hasProtection ? 'forbidden' : 'allow'
  // Routes must opt into public access. A missing metadata field must never
  // silently turn a business route into an unauthenticated route.
  if (!hasProtection) return 'login'
  if (!user) return 'login'
  if (!hasPermission(user, 'authenticated')) return 'forbidden'
  if (requiresAdmin && !hasPermission(user, 'admin')) return 'forbidden'
  if (permissions.length > 0 && !permissions.every((permission) => hasPermission(user, permission))) return 'forbidden'
  return 'allow'
}
