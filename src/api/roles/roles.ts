import type { ZodType } from 'zod'
import { requestValidated, type Result } from '../../services/http'
import type { AdminRole, PermissionGroup } from '../../types/admin'
import {
  adminIdempotentWriteHeaders,
  adminResourcePath,
  adminWriteHeaders,
  type AdminIdempotentWriteOptions,
  type AdminWriteOptions,
} from '../shared/admin'
import {
  AdminRoleListQuerySchema,
  AdminRoleListResponseSchema,
  AdminRoleSchema,
  PermissionGroupListResponseSchema,
  RoleCreateInputSchema,
  RoleIdempotentWriteOptionsSchema,
  RoleStatusInputSchema,
  RoleUpdateInputSchema,
  RoleVersionOptionsSchema,
  type AdminRoleListQuery,
  type AdminRoleListResponse,
  type PermissionGroupListResponse,
  type RoleCreateInput,
  type RoleStatusInput,
  type RoleUpdateInput,
} from './schema'

export const ROLES_PATH = '/roles'
export const ROLE_PERMISSIONS_PATH = `${ROLES_PATH}/permissions`

function validationFailure<T>(message: string, details: unknown): Result<T> {
  return { ok: false, error: { code: 'VALIDATION', message, details } }
}

function parseInput<T>(schema: ZodType<T>, input: unknown, message: string): Result<T> {
  const parsed = schema.safeParse(input)
  return parsed.success ? { ok: true, data: parsed.data } : validationFailure(message, parsed.error.issues)
}

function rolePath(roleId: string): string {
  return adminResourcePath(ROLES_PATH, roleId)
}

export function toRoleListQuery(input: AdminRoleListQuery): Record<string, string | number> {
  return {
    ...(input.page !== undefined ? { page: input.page } : {}),
    ...(input.perPage !== undefined ? { per_page: input.perPage } : {}),
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  }
}

export async function listAdminRoles(
  params: AdminRoleListQuery = {},
  options: { signal?: AbortSignal } = {},
): Promise<Result<AdminRoleListResponse>> {
  const query = parseInput(AdminRoleListQuerySchema, params, 'Invalid role list query')
  if (!query.ok) return query
  return requestValidated(
    {
      method: 'GET',
      url: ROLES_PATH,
      params: toRoleListQuery(query.data),
      ...(options.signal ? { signal: options.signal } : {}),
    },
    AdminRoleListResponseSchema,
  )
}

export function listPermissionGroups(): Promise<Result<PermissionGroupListResponse>> {
  return requestValidated({ method: 'GET', url: ROLE_PERMISSIONS_PATH }, PermissionGroupListResponseSchema)
}

export function getAdminRole(roleId: string): Promise<Result<AdminRole>> {
  return requestValidated({ method: 'GET', url: rolePath(roleId) }, AdminRoleSchema)
}

export async function createAdminRole(
  input: RoleCreateInput,
  options: { idempotencyKey: string },
): Promise<Result<AdminRole>> {
  const parsedInput = parseInput(RoleCreateInputSchema, input, 'Invalid role create input')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(RoleIdempotentWriteOptionsSchema.omit({ version: true }), options, 'Invalid role create options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'POST',
      url: ROLES_PATH,
      data: parsedInput.data,
      headers: { 'Idempotency-Key': parsedOptions.data.idempotencyKey },
    },
    AdminRoleSchema,
  )
}

export async function updateAdminRole(
  roleId: string,
  input: RoleUpdateInput,
  options: AdminWriteOptions,
): Promise<Result<AdminRole>> {
  const parsedInput = parseInput(RoleUpdateInputSchema, input, 'Invalid role update input')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(RoleVersionOptionsSchema, options, 'Invalid role version')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: rolePath(roleId),
      data: parsedInput.data,
      headers: adminWriteHeaders(parsedOptions.data.version),
    },
    AdminRoleSchema,
  )
}

export async function updateAdminRoleStatus(
  roleId: string,
  input: RoleStatusInput,
  options: AdminIdempotentWriteOptions,
): Promise<Result<AdminRole>> {
  const parsedInput = parseInput(RoleStatusInputSchema, input, 'Invalid role status input')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(RoleIdempotentWriteOptionsSchema, options, 'Invalid role status options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: `${rolePath(roleId)}/status`,
      data: parsedInput.data,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    AdminRoleSchema,
  )
}

export type { PermissionGroup }
