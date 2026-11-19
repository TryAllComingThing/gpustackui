import type { RouteRecordRaw } from 'vue-router'

export const usersRoutes: RouteRecordRaw[] = [
  {
    path: '/system/users',
    name: 'iam-user-list',
    component: () => import('./pages/UsersPage.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'page.users.title',
      breadcrumbKeys: ['nav.iam', 'nav.users'],
      nav: {
        key: 'users',
        labelKey: 'nav.users',
        icon: 'i-lucide-users',
        parentKey: 'iam',
        order: 31,
      },
    },
  },
]
