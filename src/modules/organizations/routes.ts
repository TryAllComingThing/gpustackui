import type { RouteRecordRaw } from 'vue-router'

export const organizationsRoutes: RouteRecordRaw[] = [
  {
    path: '/system/organizations',
    name: 'iam-organization-list',
    component: () => import('./pages/OrganizationsPage.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'page.organizations.title',
      breadcrumbKeys: ['nav.iam', 'nav.organizations'],
      nav: {
        key: 'organizations',
        labelKey: 'nav.organizations',
        icon: 'i-lucide-network',
        parentKey: 'iam',
        order: 30,
      },
    },
  },
]
