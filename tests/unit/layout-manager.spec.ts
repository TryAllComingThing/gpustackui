import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_LAYOUT_CONFIG, initLayout, layoutState, setLayoutConfig } from '../../src/theme/layout.manager'

const dataset: Record<string, string> = {}
const styles = new Map<string, string>()

beforeEach(() => {
  Object.keys(dataset).forEach((key) => delete dataset[key])
  styles.clear()
  vi.stubGlobal('document', { documentElement: { dataset, style: { setProperty: (key: string, value: string) => styles.set(key, value) } } })
})

describe('layout token configuration', () => {
  it('applies approved defaults and keeps breadcrumb in the header', () => {
    initLayout()
    expect(layoutState.value).toEqual(DEFAULT_LAYOUT_CONFIG)
    expect(styles.get('--gp-header-height')).toBe('60px')
    expect(styles.get('--gp-sidebar-width')).toBe('200px')
    expect(styles.get('--gp-sidebar-collapsed-width')).toBe('64px')
    expect(dataset.breadcrumbPlacement).toBe('header')
  })

  it('accepts controlled geometry overrides without changing placement', () => {
    setLayoutConfig({ headerHeight: '64px', sidebarExpandedWidth: '232px' })
    expect(layoutState.value.headerHeight).toBe('64px')
    expect(layoutState.value.sidebarExpandedWidth).toBe('232px')
    expect(layoutState.value.sidebarCollapsedWidth).toBe('64px')
    expect(layoutState.value.breadcrumbPlacement).toBe('header')
  })

  it('rejects non-length layout values and preserves approved defaults', () => {
    initLayout({ headerHeight: 'var(--bad)', sidebarExpandedWidth: '0px', sidebarCollapsedWidth: 'auto' })
    expect(layoutState.value).toEqual(DEFAULT_LAYOUT_CONFIG)
  })
})
