import { readonly, ref } from 'vue'
import typographySource from './tokens/typography.json'

const current = ref(true)
const cssPrefix = '--gp-type-'

export function initTypography() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--gp-font-family', typographySource.fontFamily)
  for (const [level, token] of Object.entries(typographySource.levels)) {
    root.style.setProperty(`${cssPrefix}${level}-size`, token.fontSize)
    root.style.setProperty(`${cssPrefix}${level}-weight`, String(token.fontWeight))
    root.style.setProperty(`${cssPrefix}${level}-line-height`, token.lineHeight)
    if ('fontFamily' in token) root.style.setProperty(`${cssPrefix}${level}-family`, token.fontFamily)
    if ('fontVariantNumeric' in token) root.style.setProperty(`${cssPrefix}${level}-variant`, token.fontVariantNumeric)
  }
  root.dataset.typography = 'saas-v1'
  current.value = true
}

export const typographyState = readonly(current)
