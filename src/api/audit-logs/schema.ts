import { z } from 'zod'
import type { AuditActionDefinition, AuditChange, AuditEvent, AuditResult } from '../../types/admin'
import { AdminIdSchema, AdminPaginationSchema, AdminTimestampSchema } from '../shared/admin'

export const AuditResultSchema = z.enum(['success', 'failure'])

export const AuditChangeSchema = z.strictObject({
  field: z.string().min(1).max(100),
  before: z.string().nullable(),
  after: z.string().nullable(),
  masked: z.boolean().optional(),
})

export const AuditEventSchema = z.strictObject({
  event_id: AdminIdSchema,
  occurred_at: AdminTimestampSchema,
  actor_id: z.string().min(1).max(128),
  actor_name: z.string().min(1).max(100),
  action: z.string().min(1).max(128),
  resource_type: z.string().min(1).max(64),
  resource_id: z.string().min(1).max(128),
  resource_name: z.string().min(1).max(200),
  result: AuditResultSchema,
  request_id: z.string().min(1).max(128),
  source_ip: z.string().max(64),
  user_agent: z.string().max(500),
  changes: z.array(AuditChangeSchema),
  related_event_ids: z.array(AdminIdSchema),
})

export const AuditEventListResponseSchema = z.strictObject({
  items: z.array(AuditEventSchema),
  pagination: AdminPaginationSchema,
})

export const AuditEventDetailResponseSchema = z.strictObject({
  event: AuditEventSchema,
  related_events: z.array(AuditEventSchema),
})

export const AuditActionDefinitionSchema = z.strictObject({
  labelKey: z.string().min(1).max(100),
  value: z.string().min(1).max(128),
})

export const AuditActionListResponseSchema = z.strictObject({ items: z.array(AuditActionDefinitionSchema) })

export const AuditEventListQuerySchema = z.strictObject({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
  action: z.string().max(128).optional(),
  result: AuditResultSchema.optional(),
  occurredFrom: AdminTimestampSchema.optional(),
  occurredTo: AdminTimestampSchema.optional(),
})

export type AuditEventListResponse = { items: AuditEvent[]; pagination: z.infer<typeof AdminPaginationSchema> }
export type AuditEventDetailResponse = { event: AuditEvent; related_events: AuditEvent[] }
export type AuditActionListResponse = { items: AuditActionDefinition[] }
export type AuditEventListQuery = z.infer<typeof AuditEventListQuerySchema>
export type { AuditChange, AuditEvent, AuditResult }
