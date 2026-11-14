import { describe, expect, it } from 'vitest'
import { appRoutes } from '../../src/app/router/routes'
import {
  DEFAULT_PRODUCT_NAME,
  createProductConfig,
  mergeProductEnv,
  resolveAppBasePath,
  resolveFeatureFlag,
  resolveProductName,
  resolveSsoLoginUrl,
} from '../../src/config/product'

describe('product configuration', () => {
  it('uses neutral product defaults and disables optional modules', () => {
    const config = createProductConfig({})
    expect(config).toEqual({
      name: DEFAULT_PRODUCT_NAME,
      enableGpuStackExample: false,
      enableDemoModules: false,
      basePath: '/',
      ssoLoginUrl: null,
    })
  })

  it('normalizes a configured product name and explicit example disable flag', () => {
    const config = createProductConfig({
      VITE_APP_NAME: '  Acme Console  ',
      VITE_ENABLE_GPUSTACK_EXAMPLE: 'false',
    })
    expect(config).toEqual({
      name: 'Acme Console',
      enableGpuStackExample: false,
      enableDemoModules: false,
      basePath: '/',
      ssoLoginUrl: null,
    })
  })

  it('treats malformed names and boolean values predictably', () => {
    expect(resolveProductName('   ')).toBe(DEFAULT_PRODUCT_NAME)
    expect(resolveFeatureFlag('0', true)).toBe(false)
    expect(resolveFeatureFlag('disabled', true)).toBe(false)
    expect(resolveFeatureFlag('yes', false)).toBe(true)
    expect(resolveFeatureFlag(undefined, true)).toBe(true)
  })

  it('lets process environment override file environment for build flags', () => {
    const env = mergeProductEnv(
      { VITE_APP_NAME: 'File Product', VITE_ENABLE_GPUSTACK_EXAMPLE: 'true' },
      { VITE_ENABLE_GPUSTACK_EXAMPLE: '0' },
    )
    expect(env).toEqual({ VITE_APP_NAME: 'File Product', VITE_ENABLE_GPUSTACK_EXAMPLE: '0' })
    expect(createProductConfig(env)).toEqual({
      name: 'File Product',
      enableGpuStackExample: false,
      enableDemoModules: false,
      basePath: '/',
      ssoLoginUrl: null,
    })
  })

  it('normalizes safe deployment base paths and rejects unsafe values', () => {
    expect(resolveAppBasePath(undefined)).toBe('/')
    expect(resolveAppBasePath('/console')).toBe('/console/')
    expect(resolveAppBasePath('/console/')).toBe('/console/')
    expect(resolveAppBasePath('/nested/app/')).toBe('/nested/app/')
    expect(resolveAppBasePath('https://example.com/console/')).toBe('/')
    expect(resolveAppBasePath('//evil.example/console/')).toBe('/')
    expect(resolveAppBasePath('/console/?redirect=//evil.example')).toBe('/')
    expect(resolveAppBasePath('/console/../admin/')).toBe('/')
    expect(resolveAppBasePath('/console/%2e%2e/admin/')).toBe('/')
  })

  it('accepts only same-origin absolute SSO paths or HTTPS destinations', () => {
    expect(resolveSsoLoginUrl(undefined)).toBeNull()
    expect(resolveSsoLoginUrl('  /auth/saml/login?next=%2Fdashboard  ')).toBe('/auth/saml/login?next=%2Fdashboard')
    expect(resolveSsoLoginUrl('https://idp.example.com/login?client=console')).toBe('https://idp.example.com/login?client=console')
    expect(resolveSsoLoginUrl('http://idp.example.com/login')).toBeNull()
    expect(resolveSsoLoginUrl('//idp.example.com/login')).toBeNull()
    expect(resolveSsoLoginUrl('/\\idp.example.com/login')).toBeNull()
    expect(resolveSsoLoginUrl('javascript:alert(1)')).toBeNull()
    expect(resolveSsoLoginUrl('https://user:secret@idp.example.com/login')).toBeNull()
  })

  it('disables fixture business modules by default while keeping the framework shell', () => {
    expect(appRoutes.some((route) => route.path === '/resources/gpus')).toBe(false)
    expect(appRoutes.some((route) => route.path === '/resources/nodes')).toBe(false)
    expect(appRoutes.some((route) => route.path === '/models')).toBe(false)
    expect(appRoutes.some((route) => route.path === '/dashboard')).toBe(true)
    expect(appRoutes.some((route) => route.path === '/settings')).toBe(true)
  })

  it('always registers the authenticated password-change page', () => {
    const route = appRoutes.find((candidate) => candidate.path === '/account/password')
    expect(route?.name).toBe('account-password')
    expect(route?.meta?.requiresAuth).toBe(true)
    expect(route?.meta?.layout).toBe('app')
  })
})
