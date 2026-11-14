import { readonly, ref } from 'vue'
import densitySource from './tokens/density.json'
import { readStoredPreference, writeStoredPreference } from '../utils/preferences'

export const DENSITY_IDS = ['compact', 'standard', 'comfortable'] as const
export type DensityId = typeof DENSITY_IDS[number]
const DEFAULT_DENSITY: DensityId = 'standard'
const current = ref<DensityId>(DEFAULT_DENSITY)

const DENSITY_CSS_PROPERTIES = {
  controlHeight: '--gp-control-height',
  tableRowHeight: '--gp-table-row-height',
  cardPadding: '--gp-card-padding',
  fieldGap: '--gp-field-gap',
  sectionGap: '--gp-section-gap',
  filterGap: '--gp-filter-gap',
  contentPadding: '--gp-content-padding',
} as const

const valid = (value: unknown): value is DensityId => typeof value === 'string' && (DENSITY_IDS as readonly string[]).includes(value)
function applyDensity(id: DensityId) {
  if (typeof document === 'undefined') return
  const preset = densitySource.presets[id]
  if (!preset) return
  document.documentElement.dataset.density = id
  for (const [key, property] of Object.entries(DENSITY_CSS_PROPERTIES)) {
    const value = preset[key as keyof typeof preset]
    if (value) document.documentElement.style.setProperty(property, value)
  }
}

export function initDensity() {
  if (typeof document === 'undefined') return
  const saved = readStoredPreference('density')
  const selected: DensityId = valid(saved) ? saved : DEFAULT_DENSITY
  current.value = selected
  applyDensity(selected)
}

export function setDensity(density: DensityId) {
  if (!valid(density)) return
  current.value = density
  applyDensity(density)
  writeStoredPreference('density', density)
}

export const densityState = readonly(current)
