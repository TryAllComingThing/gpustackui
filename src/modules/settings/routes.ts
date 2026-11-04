import type { RouteRecordRaw } from 'vue-router'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('./pages/SettingsPage.vue'),
    meta: {
      titleKey: 'page.settings.title',
      breadcrumbKeys: ['nav.settings'],
      nav: { key: 'settings', labelKey: 'nav.settings', icon: 'i-lucide-settings', order: 60 },
    },
  },
]
