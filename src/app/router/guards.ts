import type { Router } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { evaluateRouteAccess } from './access'

export interface AuthGuardOptions {
  loginRouteName?: string
  defaultRouteName?: string
  forbiddenRouteName?: string
  unavailableRouteName?: string
}

export function installAuthGuard(router: Router, options: AuthGuardOptions = {}) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    const forbidden = { name: options.forbiddenRouteName ?? 'forbidden' }
    const unavailable = (redirect: string) => ({
      name: options.unavailableRouteName ?? 'unavailable',
      query: { redirect },
    })

    const conflictingGuestAccess = to.meta.guestOnly === true && (
      to.meta.requiresAuth === true
      || to.meta.requiresAdmin === true
      || (Array.isArray(to.meta.permissions) && to.meta.permissions.length > 0)
    )
    if (conflictingGuestAccess) return forbidden

    if (to.meta.guestOnly === true) {
      if (auth.status === 'unknown' || auth.status === 'checking') {
        const result = await auth.ensureSession()
        if (!result.ok && result.error.code === 'CANCELED') return false
        if (!result.ok && result.error.code === 'FORBIDDEN') return forbidden
        if (!result.ok && result.error.code !== 'UNAUTHORIZED') return unavailable(to.fullPath)
      }
      if (auth.isAuthenticated) return { name: options.defaultRouteName ?? 'dashboard' }
      return true
    }

    const decision = evaluateRouteAccess(to.meta, auth.isAuthenticated ? auth.user : null)
    if (decision === 'allow') return true

    if (auth.status === 'unavailable') return unavailable(to.fullPath)

    if (decision === 'login') {
      if (auth.status === 'unknown' || auth.status === 'checking') {
        const result = await auth.ensureSession()
        if (!result.ok && result.error.code === 'CANCELED') return false
        if (result.ok) {
          const confirmedDecision = evaluateRouteAccess(to.meta, auth.user)
          return confirmedDecision === 'allow' ? true : forbidden
        }
        if (result.error.code === 'FORBIDDEN') return forbidden
        if (result.error.code !== 'UNAUTHORIZED') return unavailable(to.fullPath)
      }
      if (options.loginRouteName) {
        return { name: options.loginRouteName, query: { redirect: to.fullPath } }
      }
    }

    return forbidden
  })
}
