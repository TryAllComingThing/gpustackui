import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { ZodType } from 'zod'
import { toApiError, type ApiError, type Result } from './errors'

export interface HttpClientOptions {
  baseURL?: string
  timeout?: number
}

export function createHttpClient(options: HttpClientOptions = {}) {
  const client = axios.create({
    baseURL: options.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? '/v2',
    timeout: options.timeout ?? 15000,
    withCredentials: true,
  })
  client.interceptors.request.use((config) => {
    config.headers.set('X-Request-Id', typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()))
    return config
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
