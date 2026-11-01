import type { ThemeId } from './theme.types'
export const themeRegistry: Record<ThemeId, { label: string; designId: string; primary: string; default: boolean }> = {
  standard: { label: '活力科技蓝', designId: 'E', primary: '#0D61F2', default: true },
  business: { label: '沉稳商务蓝', designId: 'A2', primary: '#1554B4', default: true },
  future: { label: '蓝紫未来科技', designId: 'D', primary: '#315CF5', default: true },
  sky: { label: '明亮天空蓝', designId: 'B', primary: '#1469D8', default: false },
  ocean: { label: '深海智慧蓝', designId: 'C', primary: '#1769AA', default: false },
}
