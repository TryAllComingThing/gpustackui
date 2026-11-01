import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../../modules/dashboard/pages/DashboardPage.vue'), meta: { title: '概览', breadcrumbs: [{ label: '概览' }] } },
  { path: '/resources/gpus', component: () => import('../../modules/resources/pages/GpuResourcesPage.vue'), meta: { title: 'GPU 资源', breadcrumbs: [{ label: '资源管理' }, { label: 'GPU 资源' }] } },
  { path: '/resources/nodes', component: () => import('../../modules/resources/pages/NodeStatusPage.vue'), meta: { title: '节点状态', breadcrumbs: [{ label: '资源管理' }, { label: '节点状态' }] } },
  { path: '/models', component: () => import('../../modules/models/pages/ModelsPage.vue'), meta: { title: '模型服务', breadcrumbs: [{ label: '模型服务' }] } },
  { path: '/deployments', component: () => import('../../modules/deployments/pages/DeploymentsPage.vue'), meta: { title: '部署任务', breadcrumbs: [{ label: '部署任务' }] } },
  { path: '/services', component: () => import('../../modules/services/pages/ServicesPage.vue'), meta: { title: '服务实例', breadcrumbs: [{ label: '服务实例' }] } },
  { path: '/settings', component: () => import('../../modules/settings/pages/SettingsPage.vue'), meta: { title: '系统设置', breadcrumbs: [{ label: '系统设置' }] } },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

export default createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })
