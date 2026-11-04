import type { RouteRecordRaw } from 'vue-router'

export const servicesRoutes: RouteRecordRaw[] = [
  {
    path: '/services',
    name: 'services',
    component: () => import('./pages/ServicesPage.vue'),
    meta: {
      titleKey: 'page.services.title',
      breadcrumbKeys: ['nav.services'],
      nav: { key: 'services', labelKey: 'nav.services', icon: 'i-lucide-panels-top-left', order: 50 },
    },
  },
]
