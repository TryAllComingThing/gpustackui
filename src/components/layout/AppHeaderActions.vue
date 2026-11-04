<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { THEME_IDS, type ThemeId } from '../../theme/theme.types'
import { setTheme, themeState } from '../../theme/theme.manager'
import { DENSITY_IDS, densityState, setDensity } from '../../theme/density.manager'
import { themeRegistry } from '../../theme/theme.registry'
import { SUPPORTED_LOCALES, type Locale } from '../../locales'
import { localeState, setLocale } from '../../locales/locale.manager'

const { t } = useI18n()
const sidebarCollapsed = defineModel<boolean>('sidebarCollapsed', { default: false })
</script>

<template>
  <button
    type="button"
    class="gp-header-action"
    :aria-label="sidebarCollapsed ? t('app.sidebar.expand') : t('app.sidebar.collapse')"
    @click="sidebarCollapsed = !sidebarCollapsed"
  >
    {{ sidebarCollapsed ? t('app.sidebar.expanded') : t('app.sidebar.collapsed') }}
  </button>
  <label class="gp-header-select" for="production-theme">
    <span class="sr-only">{{ t('app.theme.label') }}</span>
    <select id="production-theme" :value="themeState" @change="setTheme(($event.target as HTMLSelectElement).value as ThemeId)">
      <option v-for="id in THEME_IDS" :key="id" :value="id">{{ themeRegistry[id].label }}</option>
    </select>
  </label>
  <label class="gp-header-select" for="production-density">
    <span class="sr-only">{{ t('app.density.label') }}</span>
    <select id="production-density" :value="densityState" @change="setDensity(($event.target as HTMLSelectElement).value as typeof DENSITY_IDS[number])">
      <option v-for="id in DENSITY_IDS" :key="id" :value="id">{{ id }}</option>
    </select>
  </label>
  <label class="gp-header-select" for="production-locale">
    <span class="sr-only">{{ t('app.locale.label') }}</span>
    <select id="production-locale" :value="localeState" @change="setLocale(($event.target as HTMLSelectElement).value as Locale)">
      <option v-for="locale in SUPPORTED_LOCALES" :key="locale" :value="locale">{{ locale }}</option>
    </select>
  </label>
</template>
