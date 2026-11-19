import type { ZodType } from 'zod'
import { requestValidated } from '../../services/http'
import type { Result } from '../../services/http'
import {
  OrganizationCreateInputSchema,
  OrganizationCreateRequestSchema,
  OrganizationIdSchema,
  OrganizationIdempotencyKeySchema,
  OrganizationListQuerySchema,
  OrganizationListResponseSchema,
  OrganizationMoveInputSchema,
  OrganizationMoveRequestSchema,
  OrganizationSchema,
  OrganizationStatusInputSchema,
  OrganizationStatusRequestSchema,
  OrganizationTreeQuerySchema,
  OrganizationTreeResponseSchema,
  OrganizationUpdateInputSchema,
  OrganizationUpdateRequestSchema,
  OrganizationVersionSchema,
  type Organization,
  type OrganizationCreateInput,
  type OrganizationCreateRequest,
  type OrganizationListQuery,
  type OrganizationListResponse,
  type OrganizationMoveInput,
  type OrganizationMoveRequest,
  type OrganizationStatusInput,
  type OrganizationStatusRequest,
  type OrganizationTreeQuery,
  type OrganizationTreeResponse,
  type OrganizationUpdateInput,
  type OrganizationUpdateRequest,
} from './schema'

export const ORGANIZATIONS_PATH = '/organizations'
export const ORGANIZATIONS_TREE_PATH = `${ORGANIZATIONS_PATH}/tree`
export const ORGANIZATION_CONTRACT_STATUS = 'DRAFT_FOR_BACKEND_RECONCILIATION' as const

export interface OrganizationWriteOptions {
  version: number
}

export interface OrganizationIdempotentWriteOptions extends OrganizationWriteOptions {
  idempotencyKey: string
}

function validationFailure<T>(message: string, details: unknown): Result<T> {
  return { ok: false, error: { code: 'VALIDATION', message, details } }
}

function parseInput<T>(schema: ZodType<T>, input: unknown, message: string): Result<T> {
  const parsed = schema.safeParse(input)
  return parsed.success ? { ok: true, data: parsed.data } : validationFailure(message, parsed.error.issues)
}

function organizationPath(organizationId: string): string {
  return `${ORGANIZATIONS_PATH}/${encodeURIComponent(organizationId)}`
}

function ifMatch(version: number): string {
  return `"${version}"`
}

export function toOrganizationCreateRequest(input: OrganizationCreateInput): OrganizationCreateRequest {
  return {
    parent_id: input.parentId,
    code: input.code,
    name: input.name,
    type: input.type,
    sort_order: input.sortOrder,
    ...(input.leaderUserId !== undefined ? { leader_user_id: input.leaderUserId } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
  }
}

export function toOrganizationUpdateRequest(input: OrganizationUpdateInput): OrganizationUpdateRequest {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.leaderUserId !== undefined ? { leader_user_id: input.leaderUserId } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
  }
}

export function toOrganizationMoveRequest(input: OrganizationMoveInput): OrganizationMoveRequest {
  return { target_parent_id: input.targetParentId, sort_order: input.sortOrder }
}

export function toOrganizationStatusRequest(input: OrganizationStatusInput): OrganizationStatusRequest {
  return {
    status: input.status,
    ...(input.reason !== undefined ? { reason: input.reason } : {}),
  }
}

export function toOrganizationTreeQuery(input: OrganizationTreeQuery): Record<string, string | number | boolean> {
  return {
    ...(input.rootId !== undefined ? { root_id: input.rootId } : {}),
    ...(input.includeInactive !== undefined ? { include_inactive: input.includeInactive } : {}),
    ...(input.maxDepth !== undefined ? { max_depth: input.maxDepth } : {}),
    ...(input.keyword !== undefined ? { keyword: input.keyword } : {}),
  }
}

export function toOrganizationListQuery(input: OrganizationListQuery): Record<string, string | number> {
  return {
    ...(input.page !== undefined ? { page: input.page } : {}),
    ...(input.perPage !== undefined ? { per_page: input.perPage } : {}),
    ...(input.search !== undefined ? { search: input.search } : {}),
    ...(input.parentId !== undefined ? { parent_id: input.parentId } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.sortBy !== undefined ? { sort_by: input.sortBy } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
}

export async function getOrganizationTree(
  params: OrganizationTreeQuery = {},
  options: { signal?: AbortSignal } = {},
): Promise<Result<OrganizationTreeResponse>> {
  const query = parseInput(OrganizationTreeQuerySchema, params, 'Invalid organization tree query')
  if (!query.ok) return query
  return requestValidated(
    {
      method: 'GET',
      url: ORGANIZATIONS_TREE_PATH,
      params: toOrganizationTreeQuery(query.data),
      ...(options.signal ? { signal: options.signal } : {}),
    },
    OrganizationTreeResponseSchema,
  )
}

export async function listOrganizations(
  params: OrganizationListQuery = {},
  options: { signal?: AbortSignal } = {},
): Promise<Result<OrganizationListResponse>> {
  const query = parseInput(OrganizationListQuerySchema, params, 'Invalid organization list query')
  if (!query.ok) return query
  return requestValidated(
    {
      method: 'GET',
      url: ORGANIZATIONS_PATH,
      params: toOrganizationListQuery(query.data),
      ...(options.signal ? { signal: options.signal } : {}),
    },
    OrganizationListResponseSchema,
  )
}

export async function getOrganization(
  organizationId: string,
  options: { signal?: AbortSignal } = {},
): Promise<Result<Organization>> {
  const id = parseInput(OrganizationIdSchema, organizationId, 'Invalid organization ID')
  if (!id.ok) return id
  return requestValidated(
    {
      method: 'GET',
      url: organizationPath(id.data),
      ...(options.signal ? { signal: options.signal } : {}),
    },
    OrganizationSchema,
  )
}

export async function createOrganization(
  input: OrganizationCreateInput,
  options: Pick<OrganizationIdempotentWriteOptions, 'idempotencyKey'>,
): Promise<Result<Organization>> {
  const parsedInput = parseInput(OrganizationCreateInputSchema, input, 'Invalid organization create request')
  if (!parsedInput.ok) return parsedInput
  const requestBody = parseInput(
    OrganizationCreateRequestSchema,
    toOrganizationCreateRequest(parsedInput.data),
    'Invalid organization create request',
  )
  if (!requestBody.ok) return requestBody
  const optionsResult = parseInput(
    OrganizationIdempotencyKeySchema,
    options.idempotencyKey,
    'Invalid Idempotency-Key',
  )
  if (!optionsResult.ok) return optionsResult

  return requestValidated(
    {
      method: 'POST',
      url: ORGANIZATIONS_PATH,
      data: requestBody.data,
      headers: { 'Idempotency-Key': optionsResult.data },
    },
    OrganizationSchema,
  )
}

export async function updateOrganization(
  organizationId: string,
  input: OrganizationUpdateInput,
  options: OrganizationWriteOptions,
): Promise<Result<Organization>> {
  const id = parseInput(OrganizationIdSchema, organizationId, 'Invalid organization ID')
  if (!id.ok) return id
  const parsedInput = parseInput(OrganizationUpdateInputSchema, input, 'Invalid organization update request')
  if (!parsedInput.ok) return parsedInput
  const requestBody = parseInput(
    OrganizationUpdateRequestSchema,
    toOrganizationUpdateRequest(parsedInput.data),
    'Invalid organization update request',
  )
  if (!requestBody.ok) return requestBody
  const version = parseInput(OrganizationVersionSchema, options.version, 'Invalid organization version')
  if (!version.ok) return version

  return requestValidated(
    {
      method: 'PATCH',
      url: organizationPath(id.data),
      data: requestBody.data,
      headers: { 'If-Match': ifMatch(version.data) },
    },
    OrganizationSchema,
  )
}

export async function moveOrganization(
  organizationId: string,
  input: OrganizationMoveInput,
  options: OrganizationIdempotentWriteOptions,
): Promise<Result<Organization>> {
  const id = parseInput(OrganizationIdSchema, organizationId, 'Invalid organization ID')
  if (!id.ok) return id
  const parsedInput = parseInput(OrganizationMoveInputSchema, input, 'Invalid organization move request')
  if (!parsedInput.ok) return parsedInput
  const requestBody = parseInput(
    OrganizationMoveRequestSchema,
    toOrganizationMoveRequest(parsedInput.data),
    'Invalid organization move request',
  )
  if (!requestBody.ok) return requestBody
  const version = parseInput(OrganizationVersionSchema, options.version, 'Invalid organization version')
  if (!version.ok) return version
  const idempotencyKey = parseInput(
    OrganizationIdempotencyKeySchema,
    options.idempotencyKey,
    'Invalid Idempotency-Key',
  )
  if (!idempotencyKey.ok) return idempotencyKey

  return requestValidated(
    {
      method: 'POST',
      url: `${organizationPath(id.data)}/move`,
      data: requestBody.data,
      headers: { 'Idempotency-Key': idempotencyKey.data, 'If-Match': ifMatch(version.data) },
    },
    OrganizationSchema,
  )
}

export async function changeOrganizationStatus(
  organizationId: string,
  input: OrganizationStatusInput,
  options: OrganizationIdempotentWriteOptions,
): Promise<Result<Organization>> {
  const id = parseInput(OrganizationIdSchema, organizationId, 'Invalid organization ID')
  if (!id.ok) return id
  const parsedInput = parseInput(OrganizationStatusInputSchema, input, 'Invalid organization status request')
  if (!parsedInput.ok) return parsedInput
  const requestBody = parseInput(
    OrganizationStatusRequestSchema,
    toOrganizationStatusRequest(parsedInput.data),
    'Invalid organization status request',
  )
  if (!requestBody.ok) return requestBody
  const version = parseInput(OrganizationVersionSchema, options.version, 'Invalid organization version')
  if (!version.ok) return version
  const idempotencyKey = parseInput(
    OrganizationIdempotencyKeySchema,
    options.idempotencyKey,
    'Invalid Idempotency-Key',
  )
  if (!idempotencyKey.ok) return idempotencyKey

  return requestValidated(
    {
      method: 'POST',
      url: `${organizationPath(id.data)}/status`,
      data: requestBody.data,
      headers: { 'Idempotency-Key': idempotencyKey.data, 'If-Match': ifMatch(version.data) },
    },
    OrganizationSchema,
  )
}
