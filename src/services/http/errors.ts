import type { AxiosError } from 'axios'

export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'CANCELED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'SERVER'
  | 'UNKNOWN'

export interface ApiError {
  code: ApiErrorCode
  status?: number
  message: string
  requestId?: string
  details?: unknown
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError }

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'VALIDATION',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION',
  429: 'CONFLICT',
  500: 'SERVER',
  502: 'SERVER',
  503: 'SERVER',
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as { isAxiosError?: boolean }).isAxiosError === true
}

export function toApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) {
    return { code: 'UNKNOWN', message: error instanceof Error ? error.message : String(error) }
  }

  const status = error.response?.status
  const code: ApiErrorCode = status
    ? STATUS_CODES[status] ?? 'UNKNOWN'
    : error.code === 'ECONNABORTED'
      ? 'TIMEOUT'
      : error.code === 'ERR_CANCELED'
        ? 'CANCELED'
        : 'NETWORK'

  const body = error.response?.data as { message?: string } | undefined
  const fallback = code === 'TIMEOUT' ? 'Request timed out' : code === 'NETWORK' ? 'Network error' : error.message
  const headers = error.response?.headers as Record<string, unknown> | undefined

  return {
    code,
    status,
    message: body?.message ?? fallback,
    requestId: typeof headers?.['x-request-id'] === 'string' ? (headers['x-request-id'] as string) : undefined,
    details: error.response?.data,
  }
}
