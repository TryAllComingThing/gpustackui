import { readonly, ref } from 'vue'
import { readStoredPreference, writeStoredPreference } from '../utils/preferences'

export const APPEARANCE_IDS = ['system', 'light', 'dark'] as const
export type AppearanceId = typeof APPEARANCE_IDS[number]
export type ResolvedAppearance = 'light' | 'dark'

const DEFAULT_APPEARANCE: AppearanceId = 'system'
const current = ref<AppearanceId>(DEFAULT_APPEARANCE)
const resolved = ref<ResolvedAppearance>('light')
let mediaQuery: MediaQueryList | null = null

const valid = (value: unknown): value is AppearanceId =>
  typeof value === 'string' && (APPEARANCE_IDS as readonly string[]).includes(value)

function resolveAppearance(preference: AppearanceId): ResolvedAppearance {
  if (preference === 'light' || preference === 'dark') return preference
  return mediaQuery?.matches ? 'dark' : 'light'
}

function applyAppearance(preference: AppearanceId) {
  if (typeof document === 'undefined') return
  const next = resolveAppearance(preference)
  current.value = preference
  resolved.value = next
  const root = document.documentElement
  root.dataset.appearance = next
  root.dataset.appearancePreference = preference
  root.style.colorScheme = next
  root.classList.toggle('dark', next === 'dark')
}

function onSystemAppearanceChange() {
  if (current.value === 'system') applyAppearance('system')
}

export function initAppearance() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  mediaQuery?.removeEventListener('change', onSystemAppearanceChange)
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', onSystemAppearanceChange)
  const saved = readStoredPreference('appearance')
  applyAppearance(valid(saved) ? saved : DEFAULT_APPEARANCE)
}

export function setAppearance(appearance: AppearanceId) {
  if (!valid(appearance)) return
  applyAppearance(appearance)
  writeStoredPreference('appearance', appearance)
}

export const appearanceState = readonly(current)
export const resolvedAppearanceState = readonly(resolved)
