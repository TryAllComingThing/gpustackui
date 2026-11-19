import type { ZodType } from 'zod'
import { requestValidated, type Result } from '../../services/http'
import type { AdminUser } from '../../types/admin'
import {
  adminIdempotentWriteHeaders,
  adminResourcePath,
  adminWriteHeaders,
  type AdminIdempotentWriteOptions,
  type AdminWriteOptions,
} from '../shared/admin'
import {
  AdminUserListQuerySchema,
  AdminUserListResponseSchema,
  AdminUserSchema,
  UserIdempotentWriteOptionsSchema,
  UserInviteInputSchema,
  UserProfileUpdateInputSchema,
  UserRoleBindingsInputSchema,
  UserStatusInputSchema,
  UserVersionOptionsSchema,
  type AdminUserListQuery,
  type AdminUserListResponse,
  type UserInviteInput,
  type UserProfileUpdateInput,
  type UserRoleBindingsInput,
  type UserStatusInput,
} from './schema'

export const USERS_PATH = '/users'

function validationFailure<T>(message: string, details: unknown): Result<T> {
  return { ok: false, error: { code: 'VALIDATION', message, details } }
}

function parseInput<T>(schema: ZodType<T>, input: unknown, message: string): Result<T> {
  const parsed = schema.safeParse(input)
  return parsed.success ? { ok: true, data: parsed.data } : validationFailure(message, parsed.error.issues)
}

function userPath(userId: string): string {
  return adminResourcePath(USERS_PATH, userId)
}

export function toUserListQuery(input: AdminUserListQuery): Record<string, string | number> {
  return {
    ...(input.page !== undefined ? { page: input.page } : {}),
    ...(input.perPage !== undefined ? { per_page: input.perPage } : {}),
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.source !== undefined ? { source: input.source } : {}),
    ...(input.sortBy !== undefined ? { sort_by: input.sortBy } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
}

export async function listAdminUsers(
  params: AdminUserListQuery = {},
  options: { signal?: AbortSignal } = {},
): Promise<Result<AdminUserListResponse>> {
  const query = parseInput(AdminUserListQuerySchema, params, 'Invalid user list query')
  if (!query.ok) return query
  return requestValidated(
    {
      method: 'GET',
      url: USERS_PATH,
      params: toUserListQuery(query.data),
      ...(options.signal ? { signal: options.signal } : {}),
    },
    AdminUserListResponseSchema,
  )
}

export function getAdminUser(userId: string): Promise<Result<AdminUser>> {
  return requestValidated({ method: 'GET', url: userPath(userId) }, AdminUserSchema)
}

export async function updateUserProfile(
  userId: string,
  input: UserProfileUpdateInput,
  options: AdminWriteOptions,
): Promise<Result<AdminUser>> {
  const parsedInput = parseInput(UserProfileUpdateInputSchema, input, 'Invalid user profile update')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(UserVersionOptionsSchema, options, 'Invalid user version')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: userPath(userId),
      data: {
        display_name: parsedInput.data.displayName,
        email: parsedInput.data.email,
        organization_id: parsedInput.data.organizationId,
      },
      headers: adminWriteHeaders(parsedOptions.data.version),
    },
    AdminUserSchema,
  )
}

export async function inviteUser(
  input: UserInviteInput,
  options: { idempotencyKey: string },
): Promise<Result<AdminUser>> {
  const parsedInput = parseInput(UserInviteInputSchema, input, 'Invalid user invitation')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(UserIdempotentWriteOptionsSchema.omit({ version: true }), options, 'Invalid invitation options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'POST',
      url: `${USERS_PATH}/invitations`,
      data: {
        username: parsedInput.data.username,
        display_name: parsedInput.data.displayName,
        email: parsedInput.data.email,
        organization_id: parsedInput.data.organizationId,
        roles: parsedInput.data.roles,
      },
      headers: { 'Idempotency-Key': parsedOptions.data.idempotencyKey },
    },
    AdminUserSchema,
  )
}

export async function updateUserRoleBindings(
  userId: string,
  input: UserRoleBindingsInput,
  options: AdminIdempotentWriteOptions,
): Promise<Result<AdminUser>> {
  const parsedInput = parseInput(UserRoleBindingsInputSchema, input, 'Invalid user role bindings')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(UserIdempotentWriteOptionsSchema, options, 'Invalid role binding options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PUT',
      url: `${userPath(userId)}/role-bindings`,
      data: parsedInput.data,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    AdminUserSchema,
  )
}

export async function updateUserStatus(
  userId: string,
  input: UserStatusInput,
  options: AdminIdempotentWriteOptions,
): Promise<Result<AdminUser>> {
  const parsedInput = parseInput(UserStatusInputSchema, input, 'Invalid user status input')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(UserIdempotentWriteOptionsSchema, options, 'Invalid user status options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: `${userPath(userId)}/status`,
      data: parsedInput.data,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    AdminUserSchema,
  )
}

export function resetUserCredential(userId: string, idempotencyKey: string): Promise<Result<AdminUser>> {
  return requestValidated(
    {
      method: 'POST',
      url: `${userPath(userId)}/credentials/reset`,
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    AdminUserSchema,
  )
}

export function revokeUserSessions(userId: string, idempotencyKey: string): Promise<Result<AdminUser>> {
  return requestValidated(
    {
      method: 'POST',
      url: `${userPath(userId)}/sessions/revoke`,
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    AdminUserSchema,
  )
}
