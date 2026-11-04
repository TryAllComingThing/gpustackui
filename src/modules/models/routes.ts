import type { RouteRecordRaw } from 'vue-router'

export const modelsRoutes: RouteRecordRaw[] = [
  {
    path: '/models',
    name: 'models',
    component: () => import('./pages/ModelsPage.vue'),
    meta: {
      titleKey: 'page.models.title',
      breadcrumbKeys: ['nav.models'],
      nav: { key: 'models', labelKey: 'nav.models', icon: 'i-lucide-box', order: 30 },
    },
  },
]
