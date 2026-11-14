import type { AxiosError } from 'axios'

export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'CANCELED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CSRF'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'SERVER'
  | 'UNKNOWN'

export interface ApiError {
  code: ApiErrorCode
  status?: number
  message: string
  requestId?: string
  retryAfterSeconds?: number
  details?: unknown
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError }

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'VALIDATION',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  408: 'TIMEOUT',
  409: 'CONFLICT',
  422: 'VALIDATION',
  429: 'RATE_LIMIT',
  500: 'SERVER',
  502: 'SERVER',
  503: 'SERVER',
  504: 'TIMEOUT',
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as { isAxiosError?: boolean }).isAxiosError === true
}

function parseRetryAfterSeconds(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.ceil(value)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  const retryAt = Date.parse(trimmed)
  if (Number.isNaN(retryAt)) return undefined
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
}

export function toApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) {
    return {
      code: error instanceof Error && error.name === 'CsrfError' ? 'CSRF' : 'UNKNOWN',
      message: error instanceof Error ? error.message : String(error),
    }
  }

  const status = error.response?.status
  const code: ApiErrorCode = status
    ? STATUS_CODES[status] ?? 'UNKNOWN'
    : error.code === 'ECONNABORTED'
      ? 'TIMEOUT'
      : error.code === 'ERR_CANCELED'
        ? 'CANCELED'
        : 'NETWORK'

  const body = typeof error.response?.data === 'object' && error.response.data !== null
    ? error.response.data as { message?: unknown }
    : undefined
  const fallback = code === 'TIMEOUT' ? 'Request timed out' : code === 'NETWORK' ? 'Network error' : error.message
  const serverMessage = typeof body?.message === 'string' && body.message.trim() ? body.message.trim() : undefined
  const headers = error.response?.headers as Record<string, unknown> | undefined
  const retryAfterSeconds = status === 429
    ? parseRetryAfterSeconds(headers?.['retry-after'] ?? headers?.['Retry-After'])
    : undefined

  return {
    code,
    status,
    message: serverMessage ?? fallback,
    requestId: typeof headers?.['x-request-id'] === 'string' ? (headers['x-request-id'] as string) : undefined,
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  }
}
