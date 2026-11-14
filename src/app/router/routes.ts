import type { RouteRecordRaw } from 'vue-router'
import { dashboardRoutes } from '../../modules/dashboard'
import { deploymentsRoutes } from '../../modules/deployments'
import { modelsRoutes } from '../../modules/models'
import { gpustackExampleRoutes, resourcesRoutes } from '../../modules/resources'
import { servicesRoutes } from '../../modules/services'
import { settingsRoutes } from '../../modules/settings'
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
  ...(configuredDemoModules ? demoRoutes : []),
  ...settingsRoutes,
  // create:module:routes
  { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue'), meta: { titleKey: 'auth.login.title', guestOnly: true, layout: 'auth' } },
  { path: '/account/password', name: 'account-password', component: () => import('../pages/PasswordChangePage.vue'), meta: { requiresAuth: true, titleKey: 'auth.password.title', breadcrumbKeys: ['auth.changePassword'], layout: 'app' } },
  { path: '/403', name: 'forbidden', component: () => import('../pages/ForbiddenPage.vue'), meta: { public: true, titleKey: 'error.forbidden', breadcrumbKeys: ['error.forbidden'], layout: 'app' } },
  { path: '/unavailable', name: 'unavailable', component: () => import('../pages/ServiceUnavailablePage.vue'), meta: { public: true, titleKey: 'error.unavailable', breadcrumbKeys: ['error.unavailable'], layout: 'app' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../pages/NotFoundPage.vue'), meta: { public: true, titleKey: 'error.notFound', breadcrumbKeys: ['error.notFound'], layout: 'app' } },
]
