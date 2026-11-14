export type ProductEnv = Record<string, string | undefined>

export const DEFAULT_PRODUCT_NAME = 'Vue SaaS Framework'

const FALSE_VALUES = new Set(['0', 'false', 'no', 'off', 'disabled'])

export function resolveProductName(value: string | undefined): string {
  const name = value?.trim()
  return name || DEFAULT_PRODUCT_NAME
}

export function resolveFeatureFlag(value: string | undefined, defaultValue: boolean): boolean {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return defaultValue
  return !FALSE_VALUES.has(normalized)
}

export interface ProductConfig {
  name: string
  enableGpuStackExample: boolean
  enableDemoModules: boolean
  basePath: string
  ssoLoginUrl: string | null
}

export function mergeProductEnv(fileEnv: ProductEnv, processEnv: ProductEnv): ProductEnv {
  return { ...fileEnv, ...processEnv }
}

export function resolveAppBasePath(value: string | undefined): string {
  const candidate = value?.trim() || '/'
  if (!candidate.startsWith('/') || candidate.startsWith('//') || /[\\?#\u0000-\u001F\u007F]/.test(candidate)) return '/'
  const segments = candidate.split('/').filter(Boolean)
  if (segments.some((segment) => segment === '.' || segment === '..' || /%2e/i.test(segment))) return '/'
  return segments.length ? `/${segments.join('/')}/` : '/'
}

export function resolveSsoLoginUrl(value: string | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate) return null

  if (candidate.startsWith('/')) {
    if (candidate.startsWith('//') || /[\\\u0000-\u001F\u007F]/.test(candidate)) return null
    try {
      const url = new URL(candidate, 'https://app.invalid')
      if (url.origin !== 'https://app.invalid') return null
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return null
    }
  }

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}

export function createProductConfig(env: ProductEnv): ProductConfig {
  return {
    name: resolveProductName(env.VITE_APP_NAME),
    enableGpuStackExample: resolveFeatureFlag(env.VITE_ENABLE_GPUSTACK_EXAMPLE, false),
    enableDemoModules: resolveFeatureFlag(env.VITE_ENABLE_DEMO_MODULES, false),
    basePath: resolveAppBasePath(env.VITE_APP_BASE),
    ssoLoginUrl: resolveSsoLoginUrl(env.VITE_SSO_LOGIN_URL),
  }
}
