import { describe, expect, it } from 'vitest'
import zhCN from '../../src/locales/zh-CN'
import enUS from '../../src/locales/en-US'
import { SUPPORTED_LOCALES } from '../../src/locales'
import { DENSITY_IDS } from '../../src/theme/density.manager'
import { THEME_IDS } from '../../src/theme/theme.types'
import { themeRegistry } from '../../src/theme/theme.registry'

type Messages = Record<string, unknown>

function flattenEntries(obj: Messages, prefix = ''): Array<{ path: string; value: unknown }> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenEntries(value as Messages, path)
    }
    return [{ path, value }]
  })
}

describe('locale message catalogs', () => {
  const zh = flattenEntries(zhCN)
  const en = flattenEntries(enUS)

  it('expose identical message key sets', () => {
    expect(en.map((entry) => entry.path).sort()).toEqual(zh.map((entry) => entry.path).sort())
  })

  it('define non-empty strings for every leaf in both locales', () => {
    for (const { path, value } of [...zh, ...en]) {
      expect(typeof value, `${path} should be a string`).toBe('string')
      expect((value as string).trim().length, `${path} should not be empty`).toBeGreaterThan(0)
    }
  })

  it('use the same interpolation placeholders in both locales', () => {
    const placeholders = (value: unknown) => [...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
      .map((match) => match[1])
      .sort()
    const zhByPath = new Map(zh.map(({ path, value }) => [path, placeholders(value)]))
    for (const { path, value } of en) {
      expect(placeholders(value), `${path} placeholders`).toEqual(zhByPath.get(path))
    }
  })

  it('resolve messages built from theme, density, and locale identifiers', () => {
    const paths = new Set(zh.map((entry) => entry.path))
    for (const id of THEME_IDS) expect(paths.has(themeRegistry[id].labelKey), themeRegistry[id].labelKey).toBe(true)
    for (const id of DENSITY_IDS) expect(paths.has(`app.densities.${id}`), id).toBe(true)
    for (const locale of SUPPORTED_LOCALES) expect(paths.has(`app.locales.${locale}`), locale).toBe(true)
  })
})
