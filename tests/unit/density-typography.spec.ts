import { beforeEach, describe, expect, it, vi } from 'vitest'
import { densityState, initDensity, setDensity } from '../../src/theme/density.manager'
import { initTypography } from '../../src/theme/typography.manager'

const dataset: Record<string, string> = {}
const styleValues = new Map<string, string>()
const storage = new Map<string, string>()

beforeEach(() => {
  Object.keys(dataset).forEach((key) => delete dataset[key])
  styleValues.clear()
  storage.clear()
  vi.stubGlobal('document', { documentElement: { dataset, style: { setProperty: (key: string, value: string) => styleValues.set(key, value) } } })
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) })
})

describe('density and typography runtime contracts', () => {
  it('applies and persists density presets independently from theme', () => {
    initDensity()
    dataset.theme = 'future'
    expect(densityState.value).toBe('standard')
    setDensity('compact')
    expect(densityState.value).toBe('compact')
    expect(dataset.density).toBe('compact')
    expect(storage.get('gpustack-density')).toBe('compact')
    expect(dataset.theme).toBe('future')
    setDensity('comfortable')
    expect(dataset.density).toBe('comfortable')
  })

  it('maps all typography levels to runtime gp variables', () => {
    initTypography()
    expect(dataset.typography).toBe('saas-v1')
    expect(styleValues.get('--gp-type-display-size')).toBe('32px')
    expect(styleValues.get('--gp-type-page-title-line-height')).toBe('32px')
    expect(styleValues.get('--gp-type-numeric-variant')).toBe('tabular-nums')
    expect(styleValues.get('--gp-type-code-family')).toContain('ui-monospace')
  })
})
