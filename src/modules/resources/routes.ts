import type { RouteRecordRaw } from 'vue-router'

export const resourcesRoutes: RouteRecordRaw[] = [
  {
    path: '/resources/nodes',
    name: 'node-status',
    component: () => import('./pages/NodeStatusPage.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'page.nodes.title',
      breadcrumbKeys: ['nav.resources', 'nav.nodes'],
      nav: { key: 'nodes', labelKey: 'nav.nodes', icon: 'i-lucide-activity', parentKey: 'resources', order: 22 },
    },
  },
]
