import { readonly, ref } from 'vue'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, i18n, type Locale } from './index'

const STORAGE_KEY = 'gpustack-locale'
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
  let saved: string | null = null
  if (typeof localStorage !== 'undefined') {
    try { saved = localStorage.getItem(STORAGE_KEY) } catch { /* storage may be blocked */ }
  }
  apply(valid(saved) ? saved : DEFAULT_LOCALE)
}

export function setLocale(locale: Locale) {
  if (!valid(locale)) return
  apply(locale)
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY, locale) } catch { /* ignore blocked storage */ }
  }
}

export const localeState = readonly(current)
