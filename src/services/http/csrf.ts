import { AxiosHeaders, type AxiosRequestConfig, type AxiosRequestHeaders } from 'axios'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

export interface CsrfEnvironment {
  PROD?: boolean
  VITE_CSRF_COOKIE_NAME?: string
  VITE_CSRF_HEADER_NAME?: string
  VITE_CSRF_REQUIRED?: string
}

export class CsrfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CsrfError'
  }
}

export function shouldAttachCsrf(method?: string): boolean {
  return !SAFE_METHODS.has((method ?? 'GET').toUpperCase())
}

export function readCookieValue(cookieHeader: string, name: string): string | null {
  if (!name) return null
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() !== name) continue
    const value = part.slice(separator + 1).trim()
    try { return decodeURIComponent(value) } catch { return value }
  }
  return null
}

export function isCsrfRequired(env: CsrfEnvironment = import.meta.env as CsrfEnvironment): boolean {
  if (env.PROD === true) return true
  if (env.VITE_CSRF_REQUIRED === 'true') return true
  if (env.VITE_CSRF_REQUIRED === 'false') return false
  return false
}

export function readCsrfToken(env: CsrfEnvironment = import.meta.env as CsrfEnvironment): string | null {
  const cookieName = (env.VITE_CSRF_COOKIE_NAME ?? '').trim()
  if (!cookieName || typeof document === 'undefined') return null
  const token = readCookieValue(document.cookie, cookieName)?.trim()
  return token || null
}

export function hasCsrfToken(env: CsrfEnvironment = import.meta.env as CsrfEnvironment): boolean {
  return readCsrfToken(env) !== null
}

export function applyCsrfHeader(config: AxiosRequestConfig, env: CsrfEnvironment = import.meta.env as CsrfEnvironment) {
  if (!shouldAttachCsrf(config.method)) return
  const cookieName = (env.VITE_CSRF_COOKIE_NAME ?? '').trim()
  const headerName = (env.VITE_CSRF_HEADER_NAME ?? 'X-CSRF-Token').trim() || 'X-CSRF-Token'
  const required = isCsrfRequired(env)
  if (!cookieName) {
    if (required) throw new CsrfError('VITE_CSRF_COOKIE_NAME is required for state-changing requests in production')
    return
  }
  if (typeof document === 'undefined') {
    if (required) throw new CsrfError(`Cannot read ${cookieName}: document is unavailable`)
    return
  }
  const token = readCsrfToken(env)
  if (!token) {
    if (required) throw new CsrfError(`${cookieName} cookie is missing; refusing to send a state-changing request`)
    return
  }
  const headers = AxiosHeaders.from(config.headers as AxiosRequestHeaders | undefined)
  headers.set(headerName, token)
  config.headers = headers
}
