<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const sidebarCollapsed = defineModel<boolean>('sidebarCollapsed', { default: false })
const sidebar = ref<HTMLElement | null>(null)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
let restoreFocusOnClose = false
const mobileDrawerOpen = computed(() => isMobile.value && !sidebarCollapsed.value)

function updateMedia() {
  isMobile.value = mediaQuery?.matches ?? false
}

function focusableElements() {
  if (!sidebar.value) return []
  return Array.from(sidebar.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => element.getClientRects().length > 0)
}

async function focusSidebar() {
  await nextTick()
  focusableElements()[0]?.focus()
}

function closeSidebar() {
  restoreFocusOnClose = true
  sidebarCollapsed.value = true
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (!isMobile.value || sidebarCollapsed.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSidebar()
    return
  }
  if (event.key !== 'Tab') return
  const focusable = focusableElements()
  if (!focusable.length) {
    event.preventDefault()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || !sidebar.value?.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !sidebar.value?.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}

watch(sidebarCollapsed, (collapsed) => {
  if (!isMobile.value) return
  if (!collapsed) {
    void focusSidebar()
    return
  }
  const active = document.activeElement
  if (restoreFocusOnClose || sidebar.value?.contains(active)) {
    restoreFocusOnClose = false
    void nextTick(() => document.querySelector<HTMLElement>('[data-testid="sidebar-toggle"]')?.focus())
  }
})

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  updateMedia()
  mediaQuery.addEventListener('change', updateMedia)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateMedia)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div class="gp-app-shell" :data-collapsed="sidebarCollapsed" :data-mobile="isMobile">
    <header class="gp-app-header" :inert="mobileDrawerOpen || undefined">
      <div class="gp-app-header__brand"><slot name="brand" /></div>
      <slot name="breadcrumb" />
      <div class="gp-app-header__actions"><slot name="actions" /></div>
    </header>
    <div class="gp-app-workspace">
      <button
        v-if="isMobile && !sidebarCollapsed"
        type="button"
        class="gp-app-sidebar-backdrop"
        :aria-label="t('app.sidebar.close')"
        data-testid="sidebar-backdrop"
        @click="closeSidebar"
      />
      <aside
        id="app-sidebar"
        ref="sidebar"
        class="gp-app-sidebar"
        data-testid="app-sidebar"
        :role="mobileDrawerOpen ? 'dialog' : undefined"
        :aria-modal="mobileDrawerOpen ? 'true' : undefined"
        :aria-hidden="isMobile && sidebarCollapsed ? 'true' : undefined"
        :aria-label="isMobile ? t('aria.sidebar') : undefined"
        tabindex="-1"
      ><slot name="sidebar" /></aside>
      <main class="gp-app-main" :inert="mobileDrawerOpen || undefined"><slot /></main>
    </div>
  </div>
</template>
