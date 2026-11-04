import type { RouteRecordRaw } from 'vue-router'

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./pages/DashboardPage.vue'),
    meta: {
      titleKey: 'page.dashboard.title',
      breadcrumbKeys: ['nav.dashboard'],
      nav: { key: 'dashboard', labelKey: 'nav.dashboard', icon: 'i-lucide-layout-dashboard', order: 10 },
    },
  },
]
