import { beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_IDS } from '../../src/theme/theme.types'
import { themeRegistry } from '../../src/theme/theme.registry'
import { initTheme, setTheme, themeState } from '../../src/theme/theme.manager'

const dataset: Record<string, string> = {}
const values = new Map<string, string>()

function installBrowserStubs() {
  vi.stubGlobal('document', { documentElement: { dataset } })
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
}

describe('theme registry and persistence', () => {
  beforeEach(() => {
    values.clear()
    Object.keys(dataset).forEach((key) => delete dataset[key])
    installBrowserStubs()
    initTheme()
  })

  it('registers the five approved SaaS to GPUStack mappings', () => {
    expect(THEME_IDS).toEqual(['standard', 'business', 'future', 'sky', 'ocean'])
    expect(Object.fromEntries(THEME_IDS.map((id) => [id, themeRegistry[id].designId]))).toEqual({
      standard: 'E', business: 'A2', future: 'D', sky: 'B', ocean: 'C',
    })
  })

  it('applies a theme and persists it for the next initialization', () => {
    setTheme('sky')
    expect(themeState.value).toBe('sky')
    expect(dataset.theme).toBe('sky')
    expect(values.get('gpustack-theme')).toBe('sky')

    values.set('gpustack-theme', 'ocean')
    initTheme()
    expect(themeState.value).toBe('ocean')
    expect(dataset.theme).toBe('ocean')
  })

  it('falls back to standard for an invalid persisted value', () => {
    values.set('gpustack-theme', 'unknown')
    initTheme()
    expect(themeState.value).toBe('standard')
    expect(dataset.theme).toBe('standard')
  })

  it('ignores an invalid runtime theme without changing the current value', () => {
    setTheme('business')
    setTheme('invalid' as never)
    expect(themeState.value).toBe('business')
    expect(dataset.theme).toBe('business')
  })
})
