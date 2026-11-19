import { z } from 'zod'
import type { AdminListResponse, AdminUser } from '../../types/admin'
import {
  AdminIdSchema,
  AdminPaginationSchema,
  AdminStatusSchema,
  AdminTimestampSchema,
  AdminVersionSchema,
  DataScopeSchema,
  IdempotencyKeySchema,
} from '../shared/admin'

export const UserRoleBindingSchema = z.strictObject({
  role_id: AdminIdSchema,
  role_name: z.string().min(1).max(100),
  scope: DataScopeSchema,
})

export const UserRoleBindingInputSchema = z.strictObject({
  role_id: AdminIdSchema,
  scope: DataScopeSchema,
})

export const AdminUserSchema = z.strictObject({
  id: AdminIdSchema,
  username: z.string().min(1).max(64),
  display_name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  organization_id: AdminIdSchema,
  organization_name: z.string().min(1).max(100),
  status: AdminStatusSchema,
  source: z.enum(['local', 'sso']),
  roles: z.array(UserRoleBindingSchema),
  effective_permissions: z.array(z.string().min(1).max(128)),
  permissions_version: AdminVersionSchema,
  last_login_at: AdminTimestampSchema.nullable(),
  updated_at: AdminTimestampSchema,
  version: AdminVersionSchema,
  is_self: z.boolean(),
  is_last_tenant_admin: z.boolean(),
})

export const AdminUserListResponseSchema = z.strictObject({
  items: z.array(AdminUserSchema),
  pagination: AdminPaginationSchema,
})

export const AdminUserListQuerySchema = z.strictObject({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
  status: AdminStatusSchema.optional(),
  organizationId: AdminIdSchema.optional(),
  source: z.enum(['local', 'sso']).optional(),
  sortBy: z.enum(['username', 'display_name', 'organization_name', 'source', 'status', 'last_login_at', 'updated_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const UserProfileUpdateInputSchema = z.strictObject({
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  organizationId: AdminIdSchema,
})

export const UserInviteInputSchema = z.strictObject({
  username: z.string().trim().min(3).max(64),
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  organizationId: AdminIdSchema,
  roles: z.array(UserRoleBindingInputSchema).min(1),
})

export const UserRoleBindingsInputSchema = z.strictObject({
  roles: z.array(UserRoleBindingInputSchema),
})

export const UserStatusInputSchema = z.strictObject({
  status: AdminStatusSchema,
})

export const UserVersionOptionsSchema = z.strictObject({ version: AdminVersionSchema })
export const UserIdempotentWriteOptionsSchema = z.strictObject({
  version: AdminVersionSchema,
  idempotencyKey: IdempotencyKeySchema,
})

export type AdminUserListResponse = AdminListResponse<AdminUser>
export type UserRoleBindingInput = z.infer<typeof UserRoleBindingInputSchema>
export type UserRoleBindingsRequest = z.infer<typeof UserRoleBindingsInputSchema>['roles']
export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>
export type UserProfileUpdateInput = z.infer<typeof UserProfileUpdateInputSchema>
export type UserInviteInput = z.infer<typeof UserInviteInputSchema>
export type UserRoleBindingsInput = z.infer<typeof UserRoleBindingsInputSchema>
export type UserStatusInput = z.infer<typeof UserStatusInputSchema>
