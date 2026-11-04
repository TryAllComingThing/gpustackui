import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'zh-CN'

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})
