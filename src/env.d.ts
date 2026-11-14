/// <reference types="vite/client" />

declare const __ENABLE_GPUSTACK_EXAMPLE__: boolean
declare const __ENABLE_DEMO_MODULES__: boolean

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_AUTH_BASE_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_ENABLE_GPUSTACK_EXAMPLE?: string
  readonly VITE_ENABLE_DEMO_MODULES?: string
  readonly VITE_APP_BASE?: string
  readonly VITE_SSO_LOGIN_URL?: string
  readonly VITE_CSRF_COOKIE_NAME?: string
  readonly VITE_CSRF_HEADER_NAME?: string
  readonly VITE_CSRF_REQUIRED?: string
  readonly VITE_TRUSTED_LOGOUT_ORIGINS?: string
}
