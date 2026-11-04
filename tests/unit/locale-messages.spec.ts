import { describe, expect, it } from 'vitest'
import zhCN from '../../src/locales/zh-CN'
import enUS from '../../src/locales/en-US'

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
})
