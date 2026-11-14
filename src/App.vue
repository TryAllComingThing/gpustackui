<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { activeNavKey, buildNavItems, openNavKeys } from './app/navigation/nav'
import { productConfig } from './config/product'
import { localeState } from './locales/locale.manager'
import UBreadcrumb from './components/common/UBreadcrumb.vue'
import USidebarNav from './components/common/USidebarNav.vue'
import AppShell from './components/layout/AppShell.vue'
import AppHeaderActions from './components/layout/AppHeaderActions.vue'

const { t } = useI18n()
const route = useRoute()
const productName = productConfig.name
const sidebarCollapsed = ref(typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)
const isAuthLayout = computed(() => route.meta.layout === 'auth')
let mobileMedia: MediaQueryList | null = null

function onMobileMediaChange(event: MediaQueryListEvent) {
  sidebarCollapsed.value = event.matches
}

onMounted(() => {
  mobileMedia = window.matchMedia('(max-width: 767px)')
  sidebarCollapsed.value = mobileMedia.matches
  mobileMedia.addEventListener('change', onMobileMediaChange)
})

onBeforeUnmount(() => mobileMedia?.removeEventListener('change', onMobileMediaChange))

const navItems = computed(() => buildNavItems(t))
const activeNav = ref(activeNavKey(route))
const openNavItems = ref<string[]>(openNavKeys(route))

watch(() => route.fullPath, () => {
  activeNav.value = activeNavKey(route)
  const keys = openNavKeys(route)
  if (keys.length) openNavItems.value = Array.from(new Set([...openNavItems.value, ...keys]))
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) sidebarCollapsed.value = true
}, { immediate: true })

watch([() => route.path, localeState], () => {
  const titleKey = route.meta.titleKey as string | undefined
  document.title = titleKey ? t(titleKey, { name: productName }) : t('app.name', { name: productName })
}, { immediate: true })

const breadcrumbItems = computed(() => [
  { label: t('breadcrumb.home', { name: productName }), href: '/dashboard' },
  ...((route.meta.breadcrumbKeys as string[] | undefined) ?? []).map((key, index, items) => ({ label: t(key), active: index === items.length - 1 })),
])
</script>
<template>
  <UApp>
    <RouterView v-if="isAuthLayout" />
    <AppShell v-else v-model:sidebar-collapsed="sidebarCollapsed">
      <template #brand>{{ productName }}</template>
      <template #breadcrumb><UBreadcrumb class="gp-header-breadcrumb" :items="breadcrumbItems" /></template>
      <template #actions>
        <AppHeaderActions v-model:sidebar-collapsed="sidebarCollapsed" />
      </template>
      <template #sidebar><USidebarNav v-model:active-key="activeNav" v-model:open-items="openNavItems" :items="navItems" :collapsed="sidebarCollapsed" /></template>
      <RouterView />
    </AppShell>
  </UApp>
</template>
