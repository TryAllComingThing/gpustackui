import { ref, readonly } from 'vue'
import { THEME_IDS, type ThemeId } from './theme.types'
import { readStoredPreference, writeStoredPreference } from '../utils/preferences'
const DEFAULT_THEME: ThemeId = 'standard'
const current = ref<ThemeId>(DEFAULT_THEME)
const valid = (v: unknown): v is ThemeId => typeof v === 'string' && (THEME_IDS as readonly string[]).includes(v)
export function initTheme() {
  if (typeof document === 'undefined') return
  const saved = readStoredPreference('theme')
  const selected: ThemeId = valid(saved) ? saved : DEFAULT_THEME
  current.value = selected
  document.documentElement.dataset.theme = selected
}
export function setTheme(theme: ThemeId) {
  if (!valid(theme)) return
  current.value = theme
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme
  writeStoredPreference('theme', theme)
}
export const themeState = readonly(current)
