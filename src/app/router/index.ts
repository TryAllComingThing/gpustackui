import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../../modules/dashboard/pages/DashboardPage.vue'), meta: { titleKey: 'page.dashboard.title', breadcrumbKeys: ['nav.dashboard'] } },
  { path: '/resources/gpus', component: () => import('../../modules/resources/pages/GpuResourcesPage.vue'), meta: { titleKey: 'page.gpus.title', breadcrumbKeys: ['nav.resources', 'nav.gpus'] } },
  { path: '/resources/nodes', component: () => import('../../modules/resources/pages/NodeStatusPage.vue'), meta: { titleKey: 'page.nodes.title', breadcrumbKeys: ['nav.resources', 'nav.nodes'] } },
  { path: '/models', component: () => import('../../modules/models/pages/ModelsPage.vue'), meta: { titleKey: 'page.models.title', breadcrumbKeys: ['nav.models'] } },
  { path: '/deployments', component: () => import('../../modules/deployments/pages/DeploymentsPage.vue'), meta: { titleKey: 'page.deployments.title', breadcrumbKeys: ['nav.deployments'] } },
  { path: '/services', component: () => import('../../modules/services/pages/ServicesPage.vue'), meta: { titleKey: 'page.services.title', breadcrumbKeys: ['nav.services'] } },
  { path: '/settings', component: () => import('../../modules/settings/pages/SettingsPage.vue'), meta: { titleKey: 'page.settings.title', breadcrumbKeys: ['nav.settings'] } },
  { path: '/403', name: 'forbidden', component: () => import('../pages/ForbiddenPage.vue'), meta: { titleKey: 'error.forbidden', breadcrumbKeys: ['error.forbidden'] } },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

export default createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })
