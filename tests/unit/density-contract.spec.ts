import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import densitySource from '../../src/theme/tokens/density.json'
import { DENSITY_IDS, setDensity } from '../../src/theme/density.manager'

const CSS_PROPERTIES: Record<string, string> = {
  controlHeight: '--gp-control-height',
  tableRowHeight: '--gp-table-row-height',
  cardPadding: '--gp-card-padding',
  fieldGap: '--gp-field-gap',
  sectionGap: '--gp-section-gap',
  filterGap: '--gp-filter-gap',
  contentPadding: '--gp-content-padding',
}

function cssValues() {
  const css = readFileSync(join(process.cwd(), 'src/theme/styles/tokens.css'), 'utf8')
  return Object.fromEntries(DENSITY_IDS.map((id) => {
    const block = css.match(new RegExp(`:root\\[data-density="${id}"\\] \\{([\\s\\S]*?)\\}`))?.[1] ?? ''
    return [id, Object.fromEntries(Object.entries(CSS_PROPERTIES).map(([key, property]) => {
      const value = block.match(new RegExp(`${property}:\\s*([^;]+);`))?.[1]?.trim() ?? null
      return [key, value]
    }))]
  }))
}

describe('density token contract', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps CSS fallbacks in full parity with the density JSON source', () => {
    const fallbacks = cssValues()
    for (const id of DENSITY_IDS) {
      for (const key of Object.keys(CSS_PROPERTIES)) {
        expect(fallbacks[id][key], `${id}.${key}`).toBe(densitySource.presets[id][key as keyof typeof densitySource.presets[typeof id]])
      }
    }
  })

  it('applies every density value from JSON at runtime', () => {
    const setProperty = vi.fn()
    vi.stubGlobal('document', { documentElement: { dataset: {} as Record<string, string>, style: { setProperty } } })
    vi.stubGlobal('localStorage', { setItem: vi.fn() })

    setDensity('compact')
    const documentElement = document.documentElement as unknown as { dataset: Record<string, string> }
    expect(documentElement.dataset.density).toBe('compact')
    for (const [key, property] of Object.entries(CSS_PROPERTIES)) {
      expect(setProperty).toHaveBeenCalledWith(property, densitySource.presets.compact[key as keyof typeof densitySource.presets.compact])
    }
  })

  it('does not let density changes overwrite layout geometry', () => {
    const setProperty = vi.fn()
    vi.stubGlobal('document', { documentElement: { dataset: {} as Record<string, string>, style: { setProperty } } })
    vi.stubGlobal('localStorage', { setItem: vi.fn() })

    setDensity('compact')
    const properties = setProperty.mock.calls.map(([property]) => property)
    expect(properties).not.toContain('--gp-header-height')
    expect(properties).not.toContain('--gp-sidebar-width')
    expect(properties).not.toContain('--gp-sidebar-collapsed-width')
  })
})
