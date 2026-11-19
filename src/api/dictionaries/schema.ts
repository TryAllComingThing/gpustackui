import { z } from 'zod'
import type { AdminListResponse, DictionaryEntry, DictionaryType } from '../../types/admin'
import {
  AdminIdSchema,
  AdminPaginationSchema,
  AdminStatusSchema,
  AdminTimestampSchema,
  AdminVersionSchema,
  IdempotencyKeySchema,
} from '../shared/admin'

export const DictionaryTypeSchema = z.strictObject({
  id: AdminIdSchema,
  code: z.string().regex(/^[a-z][a-z0-9_]{2,63}$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  entry_count: z.number().int().min(0),
  status: AdminStatusSchema,
  version: AdminVersionSchema,
  updated_at: AdminTimestampSchema,
})

export const DictionaryEntrySchema = z.strictObject({
  id: AdminIdSchema,
  type_id: AdminIdSchema,
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  sort_order: z.number().int().min(0),
  status: AdminStatusSchema,
  is_default: z.boolean(),
  version: AdminVersionSchema,
  updated_at: AdminTimestampSchema,
})

export const DictionaryTypeListResponseSchema = z.strictObject({
  items: z.array(DictionaryTypeSchema),
  pagination: AdminPaginationSchema,
})

export const DictionaryEntryListResponseSchema = z.strictObject({
  items: z.array(DictionaryEntrySchema),
  pagination: AdminPaginationSchema,
})

export const DictionaryTypeListQuerySchema = z.strictObject({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
  status: AdminStatusSchema.optional(),
})

export const DictionaryTypeCreateInputSchema = z.strictObject({
  code: z.string().trim().regex(/^[a-z][a-z0-9_]{2,63}$/),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
})

export const DictionaryTypeUpdateInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
})

export const DictionaryEntryCreateInputSchema = z.strictObject({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  sort_order: z.number().int().min(0),
  is_default: z.boolean(),
})

export const DictionaryEntryUpdateInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  sort_order: z.number().int().min(0),
  is_default: z.boolean(),
})
export const DictionaryStatusInputSchema = z.strictObject({ status: AdminStatusSchema })
export const DictionaryDefaultEntryInputSchema = z.strictObject({ entry_id: AdminIdSchema })
export const DictionaryCacheRefreshInputSchema = z.strictObject({ type_id: AdminIdSchema })
export const DictionaryCacheRefreshResponseSchema = z.strictObject({ refreshed_at: AdminTimestampSchema })
export const DictionaryVersionOptionsSchema = z.strictObject({ version: AdminVersionSchema })
export const DictionaryIdempotentWriteOptionsSchema = z.strictObject({
  version: AdminVersionSchema,
  idempotencyKey: IdempotencyKeySchema,
})

export type DictionaryTypeListResponse = AdminListResponse<DictionaryType>
export type DictionaryEntryListResponse = AdminListResponse<DictionaryEntry>
export type DictionaryTypeListQuery = z.infer<typeof DictionaryTypeListQuerySchema>
export type DictionaryTypeCreateInput = z.infer<typeof DictionaryTypeCreateInputSchema>
export type DictionaryTypeUpdateInput = z.infer<typeof DictionaryTypeUpdateInputSchema>
export type DictionaryEntryCreateInput = z.infer<typeof DictionaryEntryCreateInputSchema>
export type DictionaryEntryUpdateInput = z.infer<typeof DictionaryEntryUpdateInputSchema>
export type DictionaryStatusInput = z.infer<typeof DictionaryStatusInputSchema>
export type DictionaryCacheRefreshResponse = z.infer<typeof DictionaryCacheRefreshResponseSchema>
