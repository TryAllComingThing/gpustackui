import { readonly, ref } from 'vue'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, i18n, type Locale } from './index'
import { readStoredPreference, writeStoredPreference } from '../utils/preferences'

const current = ref<Locale>(DEFAULT_LOCALE)

const valid = (value: unknown): value is Locale =>
  typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)

function apply(locale: Locale) {
  current.value = locale
  i18n.global.locale.value = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    document.documentElement.dir = 'ltr'
  }
}

export function initLocale() {
  const saved = readStoredPreference('locale')
  apply(valid(saved) ? saved : DEFAULT_LOCALE)
}

export function setLocale(locale: Locale) {
  if (!valid(locale)) return
  apply(locale)
  writeStoredPreference('locale', locale)
}

export const localeState = readonly(current)
