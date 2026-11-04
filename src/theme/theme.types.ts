// Five first-class public themes. Keep the complete list literal so static
// contract checks can verify runtime parity across theme types, registry, CSS
// generation and the production/Showcase selectors.
export const THEME_IDS = ['standard', 'business', 'future', 'sky', 'ocean'] as const
export type ThemeId = typeof THEME_IDS[number]
