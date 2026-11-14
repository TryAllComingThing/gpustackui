import type { ThemeId } from './theme.types'
export const themeRegistry: Record<ThemeId, { labelKey: string }> = {
  standard: { labelKey: 'app.themes.standard' },
  business: { labelKey: 'app.themes.business' },
  future: { labelKey: 'app.themes.future' },
  sky: { labelKey: 'app.themes.sky' },
  ocean: { labelKey: 'app.themes.ocean' },
}
