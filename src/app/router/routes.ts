import type { RouteRecordRaw } from 'vue-router'
import { announcementsRoutes } from '../../modules/announcements'
import { auditLogsRoutes } from '../../modules/audit-logs'
import { dashboardRoutes } from '../../modules/dashboard'
import { deploymentsRoutes } from '../../modules/deployments'
import { dictionariesRoutes } from '../../modules/dictionaries'
import { modelsRoutes } from '../../modules/models'
import { organizationsRoutes } from '../../modules/organizations'
import { gpustackExampleRoutes, resourcesRoutes } from '../../modules/resources'
import { rolesRoutes } from '../../modules/roles'
import { servicesRoutes } from '../../modules/services'
import { settingsRoutes } from '../../modules/settings'
import { usersRoutes } from '../../modules/users'
// create:module:imports

const configuredGpuStackExample = __ENABLE_GPUSTACK_EXAMPLE__
const configuredDemoModules = __ENABLE_DEMO_MODULES__

const demoRoutes: RouteRecordRaw[] = [
  ...resourcesRoutes,
  ...(configuredGpuStackExample ? gpustackExampleRoutes : []),
  ...modelsRoutes,
  ...deploymentsRoutes,
  ...servicesRoutes,
]

export const appRoutes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard', meta: { public: true } },
  ...dashboardRoutes,
  ...organizationsRoutes,
  ...usersRoutes,
  ...rolesRoutes,
  ...dictionariesRoutes,
  ...announcementsRoutes,
  ...auditLogsRoutes,
  ...(configuredDemoModules ? demoRoutes : []),
  ...settingsRoutes,
  // create:module:routes
  { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue'), meta: { titleKey: 'auth.login.title', guestOnly: true, layout: 'auth' } },
  { path: '/account/password', name: 'account-password', component: () => import('../pages/PasswordChangePage.vue'), meta: { requiresAuth: true, titleKey: 'auth.password.title', breadcrumbKeys: ['auth.changePassword'], layout: 'app' } },
  { path: '/403', name: 'forbidden', component: () => import('../pages/ForbiddenPage.vue'), meta: { public: true, titleKey: 'error.forbidden', breadcrumbKeys: ['error.forbidden'], layout: 'app' } },
  { path: '/unavailable', name: 'unavailable', component: () => import('../pages/ServiceUnavailablePage.vue'), meta: { public: true, titleKey: 'error.unavailable', breadcrumbKeys: ['error.unavailable'], layout: 'app' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../pages/NotFoundPage.vue'), meta: { public: true, titleKey: 'error.notFound', breadcrumbKeys: ['error.notFound'], layout: 'app' } },
]
