import { z } from 'zod'
import type { AdminListResponse, AdminRole, PermissionGroup } from '../../types/admin'
import {
  AdminIdSchema,
  AdminPaginationSchema,
  AdminStatusSchema,
  AdminTimestampSchema,
  AdminVersionSchema,
  DataScopeSchema,
  IdempotencyKeySchema,
} from '../shared/admin'

export const PermissionDefinitionSchema = z.strictObject({
  id: z.string().min(1).max(128),
  actionKey: z.string().min(1).max(64),
})

export const PermissionGroupSchema = z.strictObject({
  id: z.string().min(1).max(64),
  labelKey: z.string().min(1).max(160),
  permissions: z.array(PermissionDefinitionSchema),
})

export const AdminRoleSchema = z.strictObject({
  id: AdminIdSchema,
  code: z.string().regex(/^[a-z][a-z0-9_]{2,63}$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  builtin: z.boolean(),
  status: AdminStatusSchema,
  scope: DataScopeSchema,
  permissions: z.array(z.string().min(1).max(128)),
  user_count: z.number().int().min(0),
  version: AdminVersionSchema,
  updated_at: AdminTimestampSchema,
})

export const AdminRoleListResponseSchema = z.strictObject({
  items: z.array(AdminRoleSchema),
  pagination: AdminPaginationSchema,
})

export const PermissionGroupListResponseSchema = z.strictObject({ items: z.array(PermissionGroupSchema) })

export const AdminRoleListQuerySchema = z.strictObject({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
  status: AdminStatusSchema.optional(),
})

export const RoleCreateInputSchema = z.strictObject({
  code: z.string().trim().regex(/^[a-z][a-z0-9_]{2,63}$/),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  scope: DataScopeSchema,
  permissions: z.array(z.string().min(1).max(128)),
})

export const RoleUpdateInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  scope: DataScopeSchema,
  permissions: z.array(z.string().min(1).max(128)),
})

export const RoleStatusInputSchema = z.strictObject({ status: AdminStatusSchema })
export const RoleVersionOptionsSchema = z.strictObject({ version: AdminVersionSchema })
export const RoleIdempotentWriteOptionsSchema = z.strictObject({
  version: AdminVersionSchema,
  idempotencyKey: IdempotencyKeySchema,
})

export type AdminRoleListResponse = AdminListResponse<AdminRole>
export type PermissionGroupListResponse = { items: PermissionGroup[] }
export type AdminRoleListQuery = z.infer<typeof AdminRoleListQuerySchema>
export type RoleCreateInput = z.infer<typeof RoleCreateInputSchema>
export type RoleUpdateInput = z.infer<typeof RoleUpdateInputSchema>
export type RoleStatusInput = z.infer<typeof RoleStatusInputSchema>
