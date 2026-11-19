import type { RouteRecordRaw } from 'vue-router'

export const rolesRoutes: RouteRecordRaw[] = [
  {
    path: '/system/roles',
    name: 'iam-role-list',
    component: () => import('./pages/RolesPage.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'page.roles.title',
      breadcrumbKeys: ['nav.iam', 'nav.roles'],
      nav: {
        key: 'roles',
        labelKey: 'nav.roles',
        icon: 'i-lucide-key-round',
        parentKey: 'iam',
        order: 32,
      },
    },
  },
]
