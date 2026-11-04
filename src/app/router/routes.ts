import type { RouteRecordRaw } from 'vue-router'
import { dashboardRoutes } from '../../modules/dashboard'
import { deploymentsRoutes } from '../../modules/deployments'
import { modelsRoutes } from '../../modules/models'
import { resourcesRoutes } from '../../modules/resources'
import { servicesRoutes } from '../../modules/services'
import { settingsRoutes } from '../../modules/settings'

export const appRoutes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  ...dashboardRoutes,
  ...resourcesRoutes,
  ...modelsRoutes,
  ...deploymentsRoutes,
  ...servicesRoutes,
  ...settingsRoutes,
  { path: '/403', name: 'forbidden', component: () => import('../pages/ForbiddenPage.vue'), meta: { titleKey: 'error.forbidden', breadcrumbKeys: ['error.forbidden'] } },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]
