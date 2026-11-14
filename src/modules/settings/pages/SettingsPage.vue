<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { THEME_IDS, type ThemeId } from '../../../theme/theme.types'
import { setTheme, themeState } from '../../../theme/theme.manager'
import { themeRegistry } from '../../../theme/theme.registry'
import { DENSITY_IDS, densityState, setDensity, type DensityId } from '../../../theme/density.manager'
import { APPEARANCE_IDS, appearanceState, setAppearance, type AppearanceId } from '../../../theme/appearance.manager'
import { SUPPORTED_LOCALES, type Locale } from '../../../locales'
import { localeState, setLocale } from '../../../locales/locale.manager'
const { t } = useI18n()

const selectedTheme = computed<ThemeId>({ get: () => themeState.value, set: (value) => setTheme(value) })
const selectedDensity = computed<DensityId>({ get: () => densityState.value, set: (value) => setDensity(value) })
const selectedAppearance = computed<AppearanceId>({ get: () => appearanceState.value, set: (value) => setAppearance(value) })
const selectedLocale = computed<Locale>({ get: () => localeState.value, set: (value) => setLocale(value) })
const preferences = computed(() => [
  { id: 'theme', label: t('page.settings.themeLabel'), value: `${themeState.value} · ${t(themeRegistry[themeState.value].labelKey)}` },
  { id: 'density', label: t('page.settings.densityLabel'), value: t(`app.densities.${densityState.value}`) },
  { id: 'appearance', label: t('page.settings.appearanceLabel'), value: t(`app.appearances.${appearanceState.value}`) },
  { id: 'locale', label: t('page.settings.localeLabel'), value: t(`app.locales.${localeState.value}`) },
])
</script>
<template>
  <section class="gp-page" data-testid="production-settings">
    <header class="gp-page-header">
      <div>
        <h1 class="gp-page-title">{{ t('page.settings.title') }}</h1>
        <p class="gp-secondary">{{ t('page.settings.subtitle') }}</p>
        <p class="gp-secondary" data-testid="fixture-notice">{{ t('fixture.notice') }}</p>
      </div>
    </header>
    <div class="gp-card">
      <h2 class="gp-card-title">{{ t('page.settings.controlsTitle') }}</h2>
      <p class="gp-secondary">{{ t('page.settings.controlsBody') }}</p>
      <div class="gp-settings-controls">
        <label class="gp-settings-field" for="settings-theme">
          <span class="gp-secondary">{{ t('page.settings.themeLabel') }}</span>
          <select id="settings-theme" v-model="selectedTheme" class="gp-app-select">
            <option v-for="theme in THEME_IDS" :key="theme" :value="theme">{{ theme }} · {{ t(themeRegistry[theme].labelKey) }}</option>
          </select>
        </label>
        <label class="gp-settings-field" for="settings-density">
          <span class="gp-secondary">{{ t('page.settings.densityLabel') }}</span>
          <select id="settings-density" v-model="selectedDensity" class="gp-app-select">
            <option v-for="density in DENSITY_IDS" :key="density" :value="density">{{ t(`app.densities.${density}`) }}</option>
          </select>
        </label>
        <label class="gp-settings-field" for="settings-appearance">
          <span class="gp-secondary">{{ t('page.settings.appearanceLabel') }}</span>
          <select id="settings-appearance" v-model="selectedAppearance" class="gp-app-select">
            <option v-for="appearance in APPEARANCE_IDS" :key="appearance" :value="appearance">{{ t(`app.appearances.${appearance}`) }}</option>
          </select>
        </label>
        <label class="gp-settings-field" for="settings-locale">
          <span class="gp-secondary">{{ t('page.settings.localeLabel') }}</span>
          <select id="settings-locale" v-model="selectedLocale" class="gp-app-select">
            <option v-for="locale in SUPPORTED_LOCALES" :key="locale" :value="locale">{{ t(`app.locales.${locale}`) }}</option>
          </select>
        </label>
      </div>
    </div>
    <div class="gp-page-grid">
      <article v-for="item in preferences" :key="item.id" class="gp-card gp-stat-card">
        <span class="gp-secondary">{{ item.label }}</span>
        <strong class="gp-body" :data-testid="`settings-${item.id}-value`">{{ item.value }}</strong>
      </article>
    </div>
    <div class="gp-card">
      <h2 class="gp-card-title">{{ t('page.settings.storageTitle') }}</h2>
      <p class="gp-body">{{ t('page.settings.storageBody') }}</p>
    </div>
    <div class="gp-card">
      <h2 class="gp-card-title">{{ t('page.settings.scopeTitle') }}</h2>
      <p class="gp-body">{{ t('page.settings.scopeBody') }}</p>
    </div>
  </section>
</template>

<style scoped>
.gp-settings-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--gp-field-gap); margin-top: var(--gp-space-3); }
.gp-settings-field { display: grid; gap: var(--gp-space-2); min-width: 0; }
.gp-settings-field select { width: 100%; padding-inline: var(--gp-space-3); }
@media (max-width: 767px) { .gp-settings-controls { grid-template-columns: 1fr; } }
</style>
