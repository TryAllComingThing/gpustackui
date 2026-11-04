import axios, { type AxiosRequestConfig } from 'axios'
import type { ZodType } from 'zod'
import { toApiError, type ApiError, type Result } from './errors'

export interface HttpClientOptions {
  baseURL?: string
  timeout?: number
}

export function createHttpClient(options: HttpClientOptions = {}) {
  const client = axios.create({
    baseURL: options.baseURL ?? '/api',
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

export async function request<T>(config: AxiosRequestConfig): Promise<Result<T>> {
  try {
    const response = await http.request<T>(config)
    return { ok: true, data: response.data }
  } catch (error) {
    return { ok: false, error: toApiError(error) }
  }
}

export async function requestValidated<T>(config: AxiosRequestConfig, schema: ZodType<T>): Promise<Result<T>> {
  const result = await request<unknown>(config)
  if (!result.ok) return result
  const parsed = schema.safeParse(result.data)
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION', message: 'Response schema mismatch', details: parsed.error.issues } satisfies ApiError }
  }
  return { ok: true, data: parsed.data }
}
