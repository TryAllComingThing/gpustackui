import type { RouteRecordRaw } from 'vue-router'

export const deploymentsRoutes: RouteRecordRaw[] = [
  {
    path: '/deployments',
    name: 'deployments',
    component: () => import('./pages/DeploymentsPage.vue'),
    meta: {
      titleKey: 'page.deployments.title',
      breadcrumbKeys: ['nav.deployments'],
      nav: { key: 'deployments', labelKey: 'nav.deployments', icon: 'i-lucide-rocket', order: 40 },
    },
  },
]
