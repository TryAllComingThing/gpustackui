import type { RouteRecordRaw } from 'vue-router'

export const auditLogsRoutes: RouteRecordRaw[] = [
  {
    path: '/audit/logs',
    name: 'audit-log-list',
    component: () => import('./pages/AuditLogsPage.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'page.auditLogs.title',
      breadcrumbKeys: ['nav.security', 'nav.auditLogs'],
      nav: {
        key: 'auditLogs',
        labelKey: 'nav.auditLogs',
        icon: 'i-lucide-scroll-text',
        parentKey: 'security',
        order: 70,
      },
    },
  },
  {
    path: '/audit/logs/:eventId',
    name: 'audit-log-detail',
    component: () => import('./pages/AuditLogDetailPage.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'page.auditLogs.detailTitle',
      breadcrumbKeys: ['nav.security', 'nav.auditLogs', 'page.auditLogs.detailTitle'],
    },
  },
]
