import type { RouteRecordRaw } from 'vue-router'

export const announcementsRoutes: RouteRecordRaw[] = [
  {
    path: '/content/announcements',
    name: 'content-announcement-list',
    component: () => import('./pages/AnnouncementsPage.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'page.announcements.title',
      breadcrumbKeys: ['nav.content', 'nav.announcements'],
      nav: {
        key: 'announcements',
        labelKey: 'nav.announcements',
        icon: 'i-lucide-megaphone',
        parentKey: 'content',
        order: 35,
      },
    },
  },
]
