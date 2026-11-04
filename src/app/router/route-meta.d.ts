import 'vue-router'
import type { AuthPermission } from '../../services/auth/permissions'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey?: string
    breadcrumbKeys?: string[]
    requiresAuth?: boolean
    requiresAdmin?: boolean
    permissions?: AuthPermission[]
    nav?: {
      key: string
      labelKey: string
      icon?: string
      parentKey?: string
      order?: number
    }
  }
}

export {}
