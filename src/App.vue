<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui/runtime/components/NavigationMenu.vue'
import { THEME_IDS } from './theme/theme.types'
import { setTheme, themeState } from './theme/theme.manager'
import { DENSITY_IDS, densityState, setDensity } from './theme/density.manager'
import { themeRegistry } from './theme/theme.registry'
import DrpBreadcrumb from './components/common/DrpBreadcrumb.vue'
import DrpSidebarNav from './components/common/DrpSidebarNav.vue'
import AppShell from './components/layout/AppShell.vue'
const route = useRoute()
const sidebarCollapsed = ref(false)
const navItems: NavigationMenuItem[] = [
  { value: 'dashboard', label: '概览', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  {
    value: 'resources', label: '资源管理', type: 'trigger', icon: 'i-lucide-server', defaultOpen: true,
    children: [
      { value: 'gpus', label: 'GPU 资源', to: '/resources/gpus', icon: 'i-lucide-cpu' },
      { value: 'nodes', label: '节点状态', to: '/resources/nodes', icon: 'i-lucide-activity' },
    ],
  },
  { value: 'models', label: '模型服务', to: '/models', icon: 'i-lucide-box' },
  { value: 'deployments', label: '部署任务', to: '/deployments', icon: 'i-lucide-rocket' },
  { value: 'services', label: '服务实例', to: '/services', icon: 'i-lucide-panels-top-left' },
  { value: 'settings', label: '系统设置', to: '/settings', icon: 'i-lucide-settings' },
]
const activeNavKey = ref('dashboard')
const openNavItems = ref<string[]>([])
const routeNavKey = () => {
  if (route.path === '/resources/gpus') return 'gpus'
  if (route.path === '/resources/nodes') return 'nodes'
  return ({
    '/dashboard': 'dashboard',
    '/models': 'models',
    '/deployments': 'deployments',
    '/services': 'services',
    '/settings': 'settings',
  } as Record<string, string>)[route.path] ?? 'dashboard'
}
watch(() => route.path, () => {
  activeNavKey.value = routeNavKey()
  if (route.path.startsWith('/resources/')) openNavItems.value = ['resources']
}, { immediate: true })
const breadcrumbItems = computed(() => [{ label: 'GPUStack', href: '/dashboard' }, ...((route.meta.breadcrumbs as Array<{ label: string }>) ?? []).map((item, index, items) => ({ label: item.label, active: index === items.length - 1 }))])
</script>
<template>
  <AppShell v-model:sidebar-collapsed="sidebarCollapsed">
    <template #brand>GPUStack</template>
    <template #breadcrumb><DrpBreadcrumb :items="breadcrumbItems" /></template>
    <template #actions><button type="button" class="gp-header-action" :aria-label="sidebarCollapsed ? '展开导航' : '折叠导航'" @click="sidebarCollapsed = !sidebarCollapsed">{{ sidebarCollapsed ? '展开' : '折叠' }}</button><label class="gp-header-select" for="production-theme"><span class="sr-only">主题</span><select id="production-theme" :value="themeState" @change="setTheme(($event.target as HTMLSelectElement).value as typeof THEME_IDS[number])"><option v-for="id in THEME_IDS" :key="id" :value="id">{{themeRegistry[id].label}}</option></select></label><label class="gp-header-select" for="production-density"><span class="sr-only">密度</span><select id="production-density" :value="densityState" @change="setDensity(($event.target as HTMLSelectElement).value as typeof DENSITY_IDS[number])"><option v-for="id in DENSITY_IDS" :key="id" :value="id">{{id}}</option></select></label></template>
    <template #sidebar><DrpSidebarNav v-model:active-key="activeNavKey" v-model:open-items="openNavItems" :items="navItems" :collapsed="sidebarCollapsed" /></template>
    <RouterView />
  </AppShell>
</template>
