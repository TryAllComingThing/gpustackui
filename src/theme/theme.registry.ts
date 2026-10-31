import type { ThemeId } from './theme.types'
export const themeRegistry: Record<ThemeId, { label: string; primary: string }> = {
  standard: { label: '标准科技蓝', primary: '#0D61F2' },
  business: { label: '沉稳商务蓝', primary: '#1554B4' },
  future: { label: '蓝紫未来科技', primary: '#315CF5' }
}
