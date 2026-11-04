import { ref, readonly } from 'vue'
import { THEME_IDS, type ThemeId } from './theme.types'
const STORAGE_KEY = 'gpustack-theme'
const DEFAULT_THEME: ThemeId = 'standard'
const current = ref<ThemeId>(DEFAULT_THEME)
const valid = (v: unknown): v is ThemeId => typeof v === 'string' && (THEME_IDS as readonly string[]).includes(v)
export function initTheme() {
  if (typeof document === 'undefined') return
  let saved: string | null = null
  try { saved = localStorage.getItem(STORAGE_KEY) } catch { /* storage may be blocked */ }
  const selected: ThemeId = valid(saved) ? saved : DEFAULT_THEME
  current.value = selected
  document.documentElement.dataset.theme = selected
}
export function setTheme(theme: ThemeId) {
  if (!valid(theme)) return
  current.value = theme
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore blocked storage */ }
}
export const themeState = readonly(current)
