<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { NavigationMenuItem } from '@nuxt/ui/runtime/components/NavigationMenu.vue'
import { THEME_IDS } from './theme/theme.types'
import { setTheme, themeState } from './theme/theme.manager'
import { DENSITY_IDS, densityState, setDensity } from './theme/density.manager'
import { themeRegistry } from './theme/theme.registry'
import { SUPPORTED_LOCALES, type Locale } from './locales'
import { localeState, setLocale } from './locales/locale.manager'
import UBreadcrumb from './components/common/UBreadcrumb.vue'
import USidebarNav from './components/common/USidebarNav.vue'
import AppShell from './components/layout/AppShell.vue'

const { t } = useI18n()
const route = useRoute()
const sidebarCollapsed = ref(typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)

const navItems = computed<NavigationMenuItem[]>(() => [
  { value: 'dashboard', label: t('nav.dashboard'), to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  {
    value: 'resources', label: t('nav.resources'), type: 'trigger', icon: 'i-lucide-server', defaultOpen: true,
    children: [
      { value: 'gpus', label: t('nav.gpus'), to: '/resources/gpus', icon: 'i-lucide-cpu' },
      { value: 'nodes', label: t('nav.nodes'), to: '/resources/nodes', icon: 'i-lucide-activity' },
    ],
  },
  { value: 'models', label: t('nav.models'), to: '/models', icon: 'i-lucide-box' },
  { value: 'deployments', label: t('nav.deployments'), to: '/deployments', icon: 'i-lucide-rocket' },
  { value: 'services', label: t('nav.services'), to: '/services', icon: 'i-lucide-panels-top-left' },
  { value: 'settings', label: t('nav.settings'), to: '/settings', icon: 'i-lucide-settings' },
])

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
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) sidebarCollapsed.value = true
}, { immediate: true })

watch([() => route.path, localeState], () => {
  const titleKey = route.meta.titleKey as string | undefined
  document.title = titleKey ? t(titleKey) : t('app.name')
}, { immediate: true })

const breadcrumbItems = computed(() => [
  { label: t('breadcrumb.home'), href: '/dashboard' },
  ...((route.meta.breadcrumbKeys as string[] | undefined) ?? []).map((key, index, items) => ({ label: t(key), active: index === items.length - 1 })),
])
</script>
<template>
  <UApp>
    <AppShell v-model:sidebar-collapsed="sidebarCollapsed">
      <template #brand>GPUStack</template>
      <template #breadcrumb><UBreadcrumb class="gp-header-breadcrumb" :items="breadcrumbItems" /></template>
      <template #actions>
        <button type="button" class="gp-header-action" :aria-label="sidebarCollapsed ? t('app.sidebar.expand') : t('app.sidebar.collapse')" @click="sidebarCollapsed = !sidebarCollapsed">{{ sidebarCollapsed ? t('app.sidebar.expanded') : t('app.sidebar.collapsed') }}</button>
        <label class="gp-header-select" for="production-theme"><span class="sr-only">{{ t('app.theme.label') }}</span><select id="production-theme" :value="themeState" @change="setTheme(($event.target as HTMLSelectElement).value as typeof THEME_IDS[number])"><option v-for="id in THEME_IDS" :key="id" :value="id">{{ themeRegistry[id].label }}</option></select></label>
        <label class="gp-header-select" for="production-density"><span class="sr-only">{{ t('app.density.label') }}</span><select id="production-density" :value="densityState" @change="setDensity(($event.target as HTMLSelectElement).value as typeof DENSITY_IDS[number])"><option v-for="id in DENSITY_IDS" :key="id" :value="id">{{ id }}</option></select></label>
        <label class="gp-header-select" for="production-locale"><span class="sr-only">{{ t('app.locale.label') }}</span><select id="production-locale" :value="localeState" @change="setLocale(($event.target as HTMLSelectElement).value as Locale)"><option v-for="locale in SUPPORTED_LOCALES" :key="locale" :value="locale">{{ locale }}</option></select></label>
      </template>
      <template #sidebar><USidebarNav v-model:active-key="activeNavKey" v-model:open-items="openNavItems" :items="navItems" :collapsed="sidebarCollapsed" /></template>
      <RouterView />
    </AppShell>
  </UApp>
</template>
