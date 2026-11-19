import { z } from 'zod'
import { ANNOUNCEMENT_STATUSES, type AdminAnnouncement, type AnnouncementAudience, type AnnouncementPreviewSnapshot, type AnnouncementStatus } from '../../types/admin'
import {
  AdminIdSchema,
  AdminPaginationSchema,
  AdminTimestampSchema,
  AdminVersionSchema,
  IdempotencyKeySchema,
} from '../shared/admin'

export const AnnouncementStatusSchema = z.enum(ANNOUNCEMENT_STATUSES)

export const AnnouncementAudienceSchema = z.strictObject({
  all: z.boolean(),
  organization_ids: z.array(AdminIdSchema),
  role_codes: z.array(z.string().min(1).max(64)),
})

export const AnnouncementPreviewSnapshotSchema = z.strictObject({
  generated_at: AdminTimestampSchema,
  title: z.string(),
  body: z.string(),
  audience_summary: z.string(),
})

export const AnnouncementSchema = z.strictObject({
  id: AdminIdSchema,
  title: z.string().min(1).max(200),
  body: z.string().max(5000),
  status: AnnouncementStatusSchema,
  audience: AnnouncementAudienceSchema,
  author: z.string().min(1).max(100),
  scheduled_at: AdminTimestampSchema.nullable(),
  published_at: AdminTimestampSchema.nullable(),
  created_at: AdminTimestampSchema,
  updated_at: AdminTimestampSchema,
  version: AdminVersionSchema,
  preview_snapshot: AnnouncementPreviewSnapshotSchema.nullable(),
})

export const AnnouncementListResponseSchema = z.strictObject({
  items: z.array(AnnouncementSchema),
  pagination: AdminPaginationSchema,
})

export const AnnouncementListQuerySchema = z.strictObject({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
  status: AnnouncementStatusSchema.optional(),
})

export const AnnouncementCreateInputSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(5000),
  audience: AnnouncementAudienceSchema,
})

export const AnnouncementUpdateInputSchema = AnnouncementCreateInputSchema
export const AnnouncementScheduleInputSchema = z.strictObject({ scheduled_at: AdminTimestampSchema })
export const AnnouncementVersionOptionsSchema = z.strictObject({ version: AdminVersionSchema })
export const AnnouncementIdempotentWriteOptionsSchema = z.strictObject({
  version: AdminVersionSchema,
  idempotencyKey: IdempotencyKeySchema,
})
export const AnnouncementIdempotencyOptionsSchema = z.strictObject({ idempotencyKey: IdempotencyKeySchema })

export type AnnouncementListResponse = { items: AdminAnnouncement[]; pagination: z.infer<typeof AdminPaginationSchema> }
export type AnnouncementListQuery = z.infer<typeof AnnouncementListQuerySchema>
export type AnnouncementCreateInput = z.infer<typeof AnnouncementCreateInputSchema>
export type AnnouncementUpdateInput = z.infer<typeof AnnouncementUpdateInputSchema>
export type { AnnouncementAudience, AnnouncementPreviewSnapshot, AnnouncementStatus }
