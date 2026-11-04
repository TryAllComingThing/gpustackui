import { readonly, ref } from 'vue'
import densitySource from './tokens/density.json'

export const DENSITY_IDS = ['compact', 'standard', 'comfortable'] as const
export type DensityId = typeof DENSITY_IDS[number]
const STORAGE_KEY = 'gpustack-density'
const DEFAULT_DENSITY: DensityId = 'standard'
const current = ref<DensityId>(DEFAULT_DENSITY)

const valid = (value: unknown): value is DensityId => typeof value === 'string' && (DENSITY_IDS as readonly string[]).includes(value)
function applyDensity(id: DensityId) {
  if (typeof document === 'undefined') return
  if (!densitySource.presets[id]) return
  document.documentElement.dataset.density = id
}

export function initDensity() {
  if (typeof document === 'undefined') return
  let saved: string | null = null
  try { saved = localStorage.getItem(STORAGE_KEY) } catch { /* storage may be blocked */ }
  const selected: DensityId = valid(saved) ? saved : DEFAULT_DENSITY
  current.value = selected
  applyDensity(selected)
}

export function setDensity(density: DensityId) {
  if (!valid(density)) return
  current.value = density
  applyDensity(density)
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, density) } catch { /* ignore blocked storage */ }
}

export const densityState = readonly(current)
