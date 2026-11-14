import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { ZodType } from 'zod'
import { notifyForbidden, notifyUnauthorized } from '../auth/session-events'
import { currentAuthEpoch } from '../auth/request-epoch'
import { applyCsrfHeader } from './csrf'
import { toApiError, type ApiError, type Result } from './errors'

export interface HttpClientOptions {
  baseURL?: string
  timeout?: number
}

function requestPathname(url: string | undefined): string {
  const value = url ?? ''
  try {
    const path = new URL(value, 'http://localhost').pathname
    return path.length > 1 ? path.replace(/\/+$/, '') : path
  } catch {
    const path = value.split(/[?#]/, 1)[0] ?? ''
    return path.length > 1 ? path.replace(/\/+$/, '') : path
  }
}

export function createHttpClient(options: HttpClientOptions = {}) {
  const client = axios.create({
    baseURL: options.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? '/v2',
    timeout: options.timeout ?? 15000,
    withCredentials: true,
  })
  client.interceptors.request.use((config) => {
    config.headers.set('X-Request-Id', typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()))
    ;(config as AxiosRequestConfig & { gpustackAuthEpoch?: number }).gpustackAuthEpoch = currentAuthEpoch()
    applyCsrfHeader(config)
    return config
  })
  client.interceptors.response.use(undefined, (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const pathname = requestPathname(error.config?.url)
      const isCredentialLogin = /\/auth\/login$/.test(pathname)
      const isSessionProbe = /(?:^|\/)users\/me$/.test(pathname)
      const isLogout = /\/auth\/logout$/.test(pathname)
      const epoch = (error.config as (AxiosRequestConfig & { gpustackAuthEpoch?: number }) | undefined)?.gpustackAuthEpoch
      if (status === 401 && !isCredentialLogin && !isSessionProbe && !isLogout) void notifyUnauthorized(epoch)
      if (status === 403 && !isCredentialLogin && !isSessionProbe && !isLogout) void notifyForbidden(epoch)
    }
    return Promise.reject(error)
  })
  return client
}

export const http = createHttpClient()
export const authHttp = createHttpClient({ baseURL: import.meta.env.VITE_AUTH_BASE_URL ?? '' })

export async function requestWithClient<T>(client: AxiosInstance, config: AxiosRequestConfig): Promise<Result<T>> {
  try {
    const response = await client.request<T>(config)
    return { ok: true, data: response.data }
  } catch (error) {
    return { ok: false, error: toApiError(error) }
  }
}

export async function requestValidatedWithClient<T>(client: AxiosInstance, config: AxiosRequestConfig, schema: ZodType<T>): Promise<Result<T>> {
  const result = await requestWithClient<unknown>(client, config)
  if (!result.ok) return result
  const parsed = schema.safeParse(result.data)
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION', message: 'Response schema mismatch', details: parsed.error.issues } satisfies ApiError }
  }
  return { ok: true, data: parsed.data }
}

export function request<T>(config: AxiosRequestConfig): Promise<Result<T>> {
  return requestWithClient(http, config)
}

export function requestValidated<T>(config: AxiosRequestConfig, schema: ZodType<T>): Promise<Result<T>> {
  return requestValidatedWithClient(http, config, schema)
}
