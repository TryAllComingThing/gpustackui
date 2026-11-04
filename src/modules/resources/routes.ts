import type { RouteRecordRaw } from 'vue-router'

export const resourcesRoutes: RouteRecordRaw[] = [
  {
    path: '/resources/gpus',
    name: 'gpu-resources',
    component: () => import('./pages/GpuResourcesPage.vue'),
    meta: {
      titleKey: 'page.gpus.title',
      breadcrumbKeys: ['nav.resources', 'nav.gpus'],
      nav: { key: 'gpus', labelKey: 'nav.gpus', icon: 'i-lucide-cpu', parentKey: 'resources', order: 21 },
    },
  },
  {
    path: '/resources/nodes',
    name: 'node-status',
    component: () => import('./pages/NodeStatusPage.vue'),
    meta: {
      titleKey: 'page.nodes.title',
      breadcrumbKeys: ['nav.resources', 'nav.nodes'],
      nav: { key: 'nodes', labelKey: 'nav.nodes', icon: 'i-lucide-activity', parentKey: 'resources', order: 22 },
    },
  },
]
