import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const readJson = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), 'utf8')) as T

interface ThemeToken {
  brand: Record<string, string>
}

describe('GPUStack framework token contract', () => {
  const themes = ['standard', 'business', 'future', 'sky', 'ocean']
  const expectedHover: Record<string, string> = {
    standard: '#0C5EEB',
    business: '#1451AE',
    future: '#2F59EE',
    sky: '#1265D1',
    ocean: '#1664A4',
  }

  it('keeps five generated themes with canonical hover values', () => {
    for (const theme of themes) {
      const css = readFileSync(join(root, `src/theme/styles/themes/${theme}.css`), 'utf8')
      expect(css).toContain(`--gp-brand-g500: ${expectedHover[theme]};`)
      expect(css).toContain('--gp-primary-hover: var(--gp-brand-g500);')
    }
  })

  it('maps semantic primary hover and pressed to distinct primitives', () => {
    const mapping = readJson<Record<string, string>>('src/theme/tokens/SEMANTIC_MAPPING.json')
    expect(mapping['action.primary.hover']).toBe('brand.hover')
    expect(mapping['action.primary.pressed']).toBe('brand.pressed')
  })

  it('keeps compatibility aliases one-way and canonical', () => {
    const css = readFileSync(join(root, 'src/theme/styles/tokens.css'), 'utf8')
    expect(css).toContain('--gp-font-xl: var(--gp-type-section-title-size);')
    expect(css).toContain('--gp-layout-header-height: var(--gp-header-height);')
    expect(css).toContain('--gp-control-height-md: var(--gp-control-height);')
    expect(css).not.toContain('--ds-')
  })

  it('uses a single canonical brand hover source in every theme dictionary', () => {
    const sources = ['A2', 'B', 'C', 'D', 'E']
    for (const source of sources) {
      const theme = readJson<ThemeToken>(`src/theme/tokens/themes/${source}.json`)
      expect(theme.brand.hover).toMatch(/^#[0-9A-F]{6}$/i)
      expect(theme.brand.hover).not.toBe(theme.brand.pressed)
    }
  })

  it('contains no legacy Drp component or drp-class references in source and docs', () => {
    const roots = ['src', 'showcase', 'docs', 'DESIGN.md', 'README.md', 'components.d.ts']
    const violations: string[] = []
    const walk = (path: string) => {
      const absolute = join(root, path)
      const info = statSync(absolute)
      if (info.isDirectory()) {
        for (const entry of readdirSync(absolute)) {
          if (entry === 'node_modules') continue
          walk(join(path, entry))
        }
        return
      }
      if (!/\.(vue|ts|js|mjs|css|json|md|d\.ts)$/.test(path)) return
      const text = readFileSync(absolute, 'utf8')
      if (/\bdrp/i.test(text)) violations.push(relative(root, absolute))
    }
    for (const path of roots) walk(path)
    expect(violations).toEqual([])
  })
})
