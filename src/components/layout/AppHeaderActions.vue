<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { THEME_IDS, type ThemeId } from '../../theme/theme.types'
import { setTheme, themeState } from '../../theme/theme.manager'
import { DENSITY_IDS, densityState, setDensity } from '../../theme/density.manager'
import { APPEARANCE_IDS, appearanceState, setAppearance, type AppearanceId } from '../../theme/appearance.manager'
import { themeRegistry } from '../../theme/theme.registry'
import { SUPPORTED_LOCALES, type Locale } from '../../locales'
import { localeState, setLocale } from '../../locales/locale.manager'
import { useAuthStore } from '../../stores/auth'
import { resolveLogoutRedirect } from '../../services/auth/logout'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const sidebarCollapsed = defineModel<boolean>('sidebarCollapsed', { default: false })
const loggingOut = ref(false)
const logoutError = ref('')
const preferencesOpen = ref(false)
const isMobile = ref(false)
const preferencesPanel = ref<HTMLElement | null>(null)
const preferencesToggle = ref<HTMLButtonElement | null>(null)
let mediaQuery: MediaQueryList | null = null

function updateMedia() {
  isMobile.value = mediaQuery?.matches ?? false
  if (!isMobile.value) preferencesOpen.value = false
}

watch(isMobile, (mobile) => {
  if (mobile) preferencesOpen.value = false
})

function closePreferences(restoreFocus = false) {
  const focusWasInside = preferencesPanel.value?.contains(document.activeElement)
  preferencesOpen.value = false
  if (restoreFocus || focusWasInside) void nextTick(() => preferencesToggle.value?.focus())
}

function togglePreferences() {
  if (preferencesOpen.value) closePreferences()
  else preferencesOpen.value = true
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && preferencesOpen.value) {
    event.preventDefault()
    closePreferences(true)
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!preferencesOpen.value) return
  const target = event.target as Node | null
  if (target && (preferencesPanel.value?.contains(target) || preferencesToggle.value?.contains(target))) return
  closePreferences()
}

watch(preferencesOpen, async (open) => {
  if (!open) return
  await nextTick()
  preferencesPanel.value?.querySelector<HTMLElement>('select')?.focus()
})

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  updateMedia()
  mediaQuery.addEventListener('change', updateMedia)
  document.addEventListener('keydown', onDocumentKeydown)
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateMedia)
  document.removeEventListener('keydown', onDocumentKeydown)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})

async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  logoutError.value = ''
  try {
    const result = await auth.logout()
    if (!result.ok) {
      if (result.error.code === 'CANCELED') return
      if (result.error.code !== 'UNAUTHORIZED') {
        logoutError.value = t('auth.errors.logoutFailed')
        return
      }
    }
    if (result.ok) {
      const redirect = resolveLogoutRedirect(result.data)
      if (redirect) {
        window.location.assign(redirect)
        return
      }
    }
    await router.replace({ name: 'login' })
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <template v-if="auth.isAuthenticated">
    <span class="gp-header-user" data-testid="auth-user">{{ t('auth.signedInAs', { username: auth.user?.username }) }}</span>
    <button type="button" class="gp-header-action" data-testid="auth-logout" :disabled="loggingOut" @click="logout">
      {{ t('auth.logout') }}
    </button>
    <RouterLink to="/account/password" class="gp-header-action" data-testid="change-password-link">
      {{ t('auth.changePassword') }}
    </RouterLink>
    <span v-if="logoutError" class="gp-header-action" role="alert" data-testid="logout-error">{{ logoutError }}</span>
  </template>
  <button
    type="button"
    class="gp-header-action"
    data-testid="sidebar-toggle"
    :aria-label="sidebarCollapsed ? t('app.sidebar.expand') : t('app.sidebar.collapse')"
    :aria-expanded="!sidebarCollapsed"
    aria-controls="app-sidebar"
    @click="sidebarCollapsed = !sidebarCollapsed"
  >
    {{ sidebarCollapsed ? t('app.sidebar.expanded') : t('app.sidebar.collapsed') }}
  </button>
  <button
    ref="preferencesToggle"
    type="button"
    class="gp-header-action gp-header-preferences-toggle"
    aria-controls="production-preferences"
    :aria-expanded="preferencesOpen"
    data-testid="preferences-toggle"
    @click="togglePreferences"
  >
    {{ t('app.preferences') }}
  </button>
  <div v-show="!isMobile || preferencesOpen" id="production-preferences" ref="preferencesPanel" class="gp-header-controls" @keydown.esc.stop.prevent="closePreferences(true)">
    <label class="gp-header-select" for="production-theme">
      <span class="sr-only">{{ t('app.theme.label') }}</span>
      <select id="production-theme" :value="themeState" @change="setTheme(($event.target as HTMLSelectElement).value as ThemeId)">
        <option v-for="id in THEME_IDS" :key="id" :value="id">{{ t(themeRegistry[id].labelKey) }}</option>
      </select>
    </label>
    <label class="gp-header-select" for="production-density">
      <span class="sr-only">{{ t('app.density.label') }}</span>
      <select id="production-density" :value="densityState" @change="setDensity(($event.target as HTMLSelectElement).value as typeof DENSITY_IDS[number])">
        <option v-for="id in DENSITY_IDS" :key="id" :value="id">{{ t(`app.densities.${id}`) }}</option>
      </select>
    </label>
    <label class="gp-header-select" for="production-appearance">
      <span class="sr-only">{{ t('app.appearance.label') }}</span>
      <select id="production-appearance" :value="appearanceState" @change="setAppearance(($event.target as HTMLSelectElement).value as AppearanceId)">
        <option v-for="id in APPEARANCE_IDS" :key="id" :value="id">{{ t(`app.appearances.${id}`) }}</option>
      </select>
    </label>
    <label class="gp-header-select" for="production-locale">
      <span class="sr-only">{{ t('app.locale.label') }}</span>
      <select id="production-locale" :value="localeState" @change="setLocale(($event.target as HTMLSelectElement).value as Locale)">
        <option v-for="locale in SUPPORTED_LOCALES" :key="locale" :value="locale">{{ t(`app.locales.${locale}`) }}</option>
      </select>
    </label>
  </div>
</template>
