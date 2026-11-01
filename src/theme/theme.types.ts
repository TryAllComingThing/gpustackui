export const DEFAULT_THEME_IDS = ['standard', 'business', 'future'] as const
export const COMPATIBILITY_THEME_IDS = ['sky', 'ocean'] as const
// Keep the complete list literal so static contract checks can verify runtime parity.
export const THEME_IDS = ['standard', 'business', 'future', 'sky', 'ocean'] as const
export type ThemeId = typeof THEME_IDS[number]
