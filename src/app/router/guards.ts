import type { Router } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { evaluateRouteAccess } from './access'

export interface AuthGuardOptions {
  loginRouteName?: string
}

export function installAuthGuard(router: Router, options: AuthGuardOptions = {}) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    const decision = evaluateRouteAccess(to.meta, auth.user)
    if (decision === 'login' && options.loginRouteName) {
      return { name: options.loginRouteName, query: { redirect: to.fullPath } }
    }
    if (decision !== 'allow') return { name: 'forbidden' }
    return true
  })
}
