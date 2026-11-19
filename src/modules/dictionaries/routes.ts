import type { RouteRecordRaw } from 'vue-router'

export const dictionariesRoutes: RouteRecordRaw[] = [
  {
    path: '/system/dictionaries',
    name: 'system-dictionary-list',
    component: () => import('./pages/DictionariesPage.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'page.dictionaries.title',
      breadcrumbKeys: ['nav.configuration', 'nav.dictionaries'],
      nav: {
        key: 'dictionaries',
        labelKey: 'nav.dictionaries',
        icon: 'i-lucide-book-key',
        parentKey: 'configuration',
        order: 56,
      },
    },
  },
]
