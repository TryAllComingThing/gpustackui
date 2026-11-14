import type { RouteRecordRaw } from 'vue-router'

export const gpustackExampleRoutes: RouteRecordRaw[] = [
  {
    path: '/resources/gpus',
    name: 'gpu-resources',
    component: () => import('./pages/GpuResourcesPage.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'page.gpus.title',
      breadcrumbKeys: ['nav.resources', 'nav.gpus'],
      nav: { key: 'gpus', labelKey: 'nav.gpus', icon: 'i-lucide-cpu', parentKey: 'resources', order: 21 },
    },
  },
]
