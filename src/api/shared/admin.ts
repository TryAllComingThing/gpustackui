import { z } from 'zod'
import { ADMIN_STATUSES, DATA_SCOPES } from '../../types/admin'

export const AdminStatusSchema = z.enum(ADMIN_STATUSES)
export const DataScopeSchema = z.enum(DATA_SCOPES)
export const AdminIdSchema = z.string().min(1).max(128)
export const AdminVersionSchema = z.number().int().min(1)
export const IdempotencyKeySchema = z.string().min(8).max(128)
export const AdminTimestampSchema = z.iso.datetime()

export const AdminPaginationSchema = z.strictObject({
  page: z.number().int().min(1),
  per_page: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  total_pages: z.number().int().min(0),
})

export const AdminListQuerySchema = z.strictObject({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
})

export interface AdminWriteOptions {
  version: number
}

export interface AdminIdempotentWriteOptions extends AdminWriteOptions {
  idempotencyKey: string
}

export function adminWriteHeaders(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` }
}

export function adminIdempotentWriteHeaders(version: number, idempotencyKey: string): Record<string, string> {
  return { ...adminWriteHeaders(version), 'Idempotency-Key': idempotencyKey }
}

export function adminResourcePath(basePath: string, id: string): string {
  return `${basePath}/${encodeURIComponent(id)}`
}

export function listQuery(input: { page?: number; perPage?: number; search?: string }): Record<string, string | number> {
  return {
    ...(input.page !== undefined ? { page: input.page } : {}),
    ...(input.perPage !== undefined ? { per_page: input.perPage } : {}),
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
  }
}
