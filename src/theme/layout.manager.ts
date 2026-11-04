import { readonly, ref } from 'vue'

export const BREADCRUMB_PLACEMENT = 'header' as const
export type BreadcrumbPlacement = typeof BREADCRUMB_PLACEMENT
export interface LayoutConfig {
  headerHeight: string
  sidebarExpandedWidth: string
  sidebarCollapsedWidth: string
  breadcrumbPlacement: BreadcrumbPlacement
}
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = { headerHeight: '60px', sidebarExpandedWidth: '200px', sidebarCollapsedWidth: '64px', breadcrumbPlacement: BREADCRUMB_PLACEMENT }
const current = ref<LayoutConfig>({ ...DEFAULT_LAYOUT_CONFIG })
const cssLength = (value: unknown): value is string => typeof value === 'string' && /^\d+(?:\.\d+)?px$/.test(value) && Number.parseFloat(value) > 0
function applyLayout(config: LayoutConfig) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--gp-header-height', config.headerHeight)
  root.style.setProperty('--gp-sidebar-width', config.sidebarExpandedWidth)
  root.style.setProperty('--gp-sidebar-collapsed-width', config.sidebarCollapsedWidth)
  root.dataset.breadcrumbPlacement = config.breadcrumbPlacement
}
export function initLayout(config: Partial<LayoutConfig> = {}) {
  const next: LayoutConfig = { ...DEFAULT_LAYOUT_CONFIG, ...(cssLength(config.headerHeight) ? { headerHeight: config.headerHeight } : {}), ...(cssLength(config.sidebarExpandedWidth) ? { sidebarExpandedWidth: config.sidebarExpandedWidth } : {}), ...(cssLength(config.sidebarCollapsedWidth) ? { sidebarCollapsedWidth: config.sidebarCollapsedWidth } : {}), breadcrumbPlacement: BREADCRUMB_PLACEMENT }
  current.value = next
  applyLayout(next)
}
export function setLayoutConfig(config: Partial<LayoutConfig>) { initLayout({ ...current.value, ...config }) }
export const layoutState = readonly(current)
