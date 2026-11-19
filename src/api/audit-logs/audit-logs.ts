import type { ZodType } from 'zod'
import { requestValidated, type Result } from '../../services/http'
import { adminResourcePath } from '../shared/admin'
import {
  AuditActionListResponseSchema,
  AuditEventDetailResponseSchema,
  AuditEventListQuerySchema,
  AuditEventListResponseSchema,
  type AuditActionListResponse,
  type AuditEventDetailResponse,
  type AuditEventListQuery,
  type AuditEventListResponse,
} from './schema'

export const AUDIT_LOGS_PATH = '/audit/logs'
export const AUDIT_ACTIONS_PATH = '/audit/actions'

function validationFailure<T>(message: string, details: unknown): Result<T> {
  return { ok: false, error: { code: 'VALIDATION', message, details } }
}

function parseInput<T>(schema: ZodType<T>, input: unknown, message: string): Result<T> {
  const parsed = schema.safeParse(input)
  return parsed.success ? { ok: true, data: parsed.data } : validationFailure(message, parsed.error.issues)
}

export function toAuditListQuery(input: AuditEventListQuery): Record<string, string | number> {
  return {
    ...(input.page !== undefined ? { page: input.page } : {}),
    ...(input.perPage !== undefined ? { per_page: input.perPage } : {}),
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    ...(input.action ? { action: input.action } : {}),
    ...(input.result ? { result: input.result } : {}),
    ...(input.occurredFrom ? { occurred_from: input.occurredFrom } : {}),
    ...(input.occurredTo ? { occurred_to: input.occurredTo } : {}),
  }
}

export async function listAuditEvents(
  params: AuditEventListQuery = {},
  options: { signal?: AbortSignal } = {},
): Promise<Result<AuditEventListResponse>> {
  const query = parseInput(AuditEventListQuerySchema, params, 'Invalid audit list query')
  if (!query.ok) return query
  return requestValidated(
    {
      method: 'GET',
      url: AUDIT_LOGS_PATH,
      params: toAuditListQuery(query.data),
      ...(options.signal ? { signal: options.signal } : {}),
    },
    AuditEventListResponseSchema,
  )
}

export function getAuditEventDetail(eventId: string): Promise<Result<AuditEventDetailResponse>> {
  return requestValidated(
    { method: 'GET', url: adminResourcePath(AUDIT_LOGS_PATH, eventId) },
    AuditEventDetailResponseSchema,
  )
}

export function listAuditActions(options: { signal?: AbortSignal } = {}): Promise<Result<AuditActionListResponse>> {
  return requestValidated(
    {
      method: 'GET',
      url: AUDIT_ACTIONS_PATH,
      ...(options.signal ? { signal: options.signal } : {}),
    },
    AuditActionListResponseSchema,
  )
}
