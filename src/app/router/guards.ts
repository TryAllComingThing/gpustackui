import type { Router } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

export function installAuthGuard(router: Router) {
  router.beforeEach((to) => {
    const requiresAuth = to.meta.requiresAuth === true
    const permissions = Array.isArray(to.meta.permissions) ? (to.meta.permissions as string[]) : []

    if (!requiresAuth && permissions.length === 0) return true

    const auth = useAuthStore()
    if (requiresAuth && !auth.isAuthenticated) return { name: 'forbidden' }
    if (permissions.length && !permissions.some((permission) => auth.hasPermission(permission))) return { name: 'forbidden' }
    return true
  })
}
