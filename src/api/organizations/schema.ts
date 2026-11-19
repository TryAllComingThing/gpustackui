import { z } from 'zod'

const DateTimeSchema = z.iso.datetime({ offset: true })

export const OrganizationIdSchema = z.string().min(1).max(128)

export const OrganizationStatusSchema = z.enum(['active', 'inactive'])
export const OrganizationTypeSchema = z.enum(['company', 'department', 'team', 'other'])

export const OrganizationSchema = z.object({
  tenant_id: z.string(),
  id: z.string(),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  type: OrganizationTypeSchema,
  status: OrganizationStatusSchema,
  parent_id: z.string().nullable(),
  sort_order: z.number().int().min(0).max(1_000_000),
  leader_user_id: z.string().nullable(),
  description: z.string().max(2000).nullable(),
  depth: z.number().int().min(1).max(4),
  version: z.number().int().min(1),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
  inactive_at: DateTimeSchema.nullable(),
})

export type Organization = z.infer<typeof OrganizationSchema>
export type OrganizationTreeNode = Organization & { children: OrganizationTreeNode[] }

export const OrganizationTreeNodeSchema: z.ZodType<OrganizationTreeNode> = z.lazy(() =>
  OrganizationSchema.extend({
    children: z.array(OrganizationTreeNodeSchema),
  }),
)

export const OrganizationPaginationSchema = z.strictObject({
  page: z.number().int().min(1),
  per_page: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  total_pages: z.number().int().min(0),
})

export const OrganizationListResponseSchema = z.strictObject({
  items: z.array(OrganizationSchema),
  pagination: OrganizationPaginationSchema,
})

export const OrganizationTreeMetaSchema = z.strictObject({
  root_id: z.string().nullable(),
  include_inactive: z.boolean(),
  max_depth: z.number().int().min(1).max(4),
  truncated: z.boolean(),
})

export const OrganizationTreeResponseSchema = z.strictObject({
  items: z.array(OrganizationTreeNodeSchema),
  meta: OrganizationTreeMetaSchema,
})

export const OrganizationCreateInputSchema = z.strictObject({
  parentId: OrganizationIdSchema,
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  type: OrganizationTypeSchema,
  sortOrder: z.number().int().min(0).max(1_000_000),
  leaderUserId: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
})

export const OrganizationCreateRequestSchema = z.strictObject({
  parent_id: z.string().min(1),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  type: OrganizationTypeSchema,
  sort_order: z.number().int().min(0).max(1_000_000),
  leader_user_id: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
})

export const OrganizationUpdateInputSchema = z
  .strictObject({
    name: z.string().min(1).max(200).optional(),
    type: OrganizationTypeSchema.optional(),
    sortOrder: z.number().int().min(0).max(1_000_000).optional(),
    leaderUserId: z.string().nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })

export const OrganizationUpdateRequestSchema = z
  .strictObject({
    name: z.string().min(1).max(200).optional(),
    type: OrganizationTypeSchema.optional(),
    sort_order: z.number().int().min(0).max(1_000_000).optional(),
    leader_user_id: z.string().nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })

export const OrganizationMoveInputSchema = z.strictObject({
  targetParentId: OrganizationIdSchema,
  sortOrder: z.number().int().min(0).max(1_000_000),
})

export const OrganizationMoveRequestSchema = z.strictObject({
  target_parent_id: z.string().min(1),
  sort_order: z.number().int().min(0).max(1_000_000),
})

export const OrganizationStatusInputSchema = z.strictObject({
  status: OrganizationStatusSchema,
  reason: z.string().max(500).optional(),
})

export const OrganizationStatusRequestSchema = z.strictObject({
  status: OrganizationStatusSchema,
  reason: z.string().max(500).optional(),
})

export const OrganizationTreeQuerySchema = z.strictObject({
  rootId: OrganizationIdSchema.optional(),
  includeInactive: z.boolean().optional(),
  maxDepth: z.number().int().min(1).max(4).optional(),
  keyword: z.string().max(200).optional(),
})

export const OrganizationSortBySchema = z.enum(['code', 'name', 'sort_order', 'created_at', 'updated_at'])
export const OrganizationSortOrderSchema = z.enum(['asc', 'desc'])

export const OrganizationListQuerySchema = z.strictObject({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
  parentId: OrganizationIdSchema.optional(),
  status: OrganizationStatusSchema.optional(),
  type: OrganizationTypeSchema.optional(),
  sortBy: OrganizationSortBySchema.optional(),
  sortOrder: OrganizationSortOrderSchema.optional(),
})

export const OrganizationIdempotencyKeySchema = z.string().min(8).max(128)
export const OrganizationVersionSchema = z.number().int().min(1)

export const OrganizationErrorCodeSchema = z.enum([
  'ORG_VALIDATION_FAILED',
  'UNAUTHORIZED',
  'ORG_FORBIDDEN',
  'ORG_NOT_FOUND',
  'ORG_PARENT_NOT_FOUND',
  'ORG_LEADER_NOT_FOUND',
  'ORG_CODE_CONFLICT',
  'ORG_PARENT_INACTIVE',
  'ORG_CYCLE',
  'ORG_MAX_DEPTH_EXCEEDED',
  'ORG_HAS_ACTIVE_CHILDREN',
  'ORG_HAS_ACTIVE_MEMBERS',
  'ORG_ROOT_PROTECTED',
  'ORG_INVALID_STATE',
  'IDEMPOTENCY_KEY_REUSED',
  'IDEMPOTENCY_IN_PROGRESS',
  'ORG_VERSION_CONFLICT',
  'PRECONDITION_REQUIRED',
  'RATE_LIMITED',
  'ORG_SERVER_ERROR',
])

export const OrganizationFieldErrorSchema = z.strictObject({
  field: z.string(),
  code: z.string(),
  message: z.string(),
})

export const OrganizationErrorSchema = z.strictObject({
  code: OrganizationErrorCodeSchema,
  message: z.string(),
  details: z
    .object({
      fields: z.array(OrganizationFieldErrorSchema).optional(),
    })
    .catchall(z.unknown())
    .optional(),
  request_id: z.string(),
})

export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>
export type OrganizationListResponse = z.infer<typeof OrganizationListResponseSchema>
export type OrganizationTreeResponse = z.infer<typeof OrganizationTreeResponseSchema>
export type OrganizationCreateInput = z.infer<typeof OrganizationCreateInputSchema>
export type OrganizationCreateRequest = z.infer<typeof OrganizationCreateRequestSchema>
export type OrganizationUpdateInput = z.infer<typeof OrganizationUpdateInputSchema>
export type OrganizationUpdateRequest = z.infer<typeof OrganizationUpdateRequestSchema>
export type OrganizationMoveInput = z.infer<typeof OrganizationMoveInputSchema>
export type OrganizationMoveRequest = z.infer<typeof OrganizationMoveRequestSchema>
export type OrganizationStatusInput = z.infer<typeof OrganizationStatusInputSchema>
export type OrganizationStatusRequest = z.infer<typeof OrganizationStatusRequestSchema>
export type OrganizationTreeQuery = z.infer<typeof OrganizationTreeQuerySchema>
export type OrganizationListQuery = z.infer<typeof OrganizationListQuerySchema>
export type OrganizationSortBy = z.infer<typeof OrganizationSortBySchema>
export type OrganizationSortOrder = z.infer<typeof OrganizationSortOrderSchema>
export type OrganizationError = z.infer<typeof OrganizationErrorSchema>
