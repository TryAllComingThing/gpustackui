import type { ZodType } from 'zod'
import { requestValidated, type Result } from '../../services/http'
import type { AdminAnnouncement } from '../../types/admin'
import {
  adminIdempotentWriteHeaders,
  adminResourcePath,
  adminWriteHeaders,
  type AdminIdempotentWriteOptions,
  type AdminWriteOptions,
} from '../shared/admin'
import {
  AnnouncementCreateInputSchema,
  AnnouncementIdempotencyOptionsSchema,
  AnnouncementIdempotentWriteOptionsSchema,
  AnnouncementListQuerySchema,
  AnnouncementListResponseSchema,
  AnnouncementScheduleInputSchema,
  AnnouncementSchema,
  AnnouncementUpdateInputSchema,
  AnnouncementVersionOptionsSchema,
  type AnnouncementCreateInput,
  type AnnouncementListQuery,
  type AnnouncementListResponse,
  type AnnouncementUpdateInput,
} from './schema'

export const ANNOUNCEMENTS_PATH = '/announcements'

function validationFailure<T>(message: string, details: unknown): Result<T> {
  return { ok: false, error: { code: 'VALIDATION', message, details } }
}

function parseInput<T>(schema: ZodType<T>, input: unknown, message: string): Result<T> {
  const parsed = schema.safeParse(input)
  return parsed.success ? { ok: true, data: parsed.data } : validationFailure(message, parsed.error.issues)
}

function announcementPath(announcementId: string): string {
  return adminResourcePath(ANNOUNCEMENTS_PATH, announcementId)
}

export async function listAdminAnnouncements(
  params: AnnouncementListQuery = {},
  options: { signal?: AbortSignal } = {},
): Promise<Result<AnnouncementListResponse>> {
  const query = parseInput(AnnouncementListQuerySchema, params, 'Invalid announcement list query')
  if (!query.ok) return query
  return requestValidated(
    {
      method: 'GET',
      url: ANNOUNCEMENTS_PATH,
      params: {
        ...(query.data.page !== undefined ? { page: query.data.page } : {}),
        ...(query.data.perPage !== undefined ? { per_page: query.data.perPage } : {}),
        ...(query.data.search?.trim() ? { search: query.data.search.trim() } : {}),
        ...(query.data.status !== undefined ? { status: query.data.status } : {}),
      },
      ...(options.signal ? { signal: options.signal } : {}),
    },
    AnnouncementListResponseSchema,
  )
}

export function getAdminAnnouncement(announcementId: string): Promise<Result<AdminAnnouncement>> {
  return requestValidated({ method: 'GET', url: announcementPath(announcementId) }, AnnouncementSchema)
}

export async function createAdminAnnouncement(
  input: AnnouncementCreateInput,
  idempotencyKey: string,
): Promise<Result<AdminAnnouncement>> {
  const parsedInput = parseInput(AnnouncementCreateInputSchema, input, 'Invalid announcement input')
  if (!parsedInput.ok) return parsedInput
  return requestValidated(
    {
      method: 'POST',
      url: ANNOUNCEMENTS_PATH,
      data: parsedInput.data,
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    AnnouncementSchema,
  )
}

export async function updateAdminAnnouncement(
  announcementId: string,
  input: AnnouncementUpdateInput,
  options: AdminWriteOptions,
): Promise<Result<AdminAnnouncement>> {
  const parsedInput = parseInput(AnnouncementUpdateInputSchema, input, 'Invalid announcement update')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(AnnouncementVersionOptionsSchema, options, 'Invalid announcement version')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: announcementPath(announcementId),
      data: parsedInput.data,
      headers: adminWriteHeaders(parsedOptions.data.version),
    },
    AnnouncementSchema,
  )
}

export async function publishAnnouncement(
  announcementId: string,
  options: AdminIdempotentWriteOptions,
): Promise<Result<AdminAnnouncement>> {
  const parsedOptions = parseInput(AnnouncementIdempotentWriteOptionsSchema, options, 'Invalid publish options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'POST',
      url: `${announcementPath(announcementId)}/publish`,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    AnnouncementSchema,
  )
}

export async function scheduleAnnouncement(
  announcementId: string,
  scheduledAt: string,
  options: AdminIdempotentWriteOptions,
): Promise<Result<AdminAnnouncement>> {
  const parsedInput = parseInput(AnnouncementScheduleInputSchema, { scheduled_at: scheduledAt }, 'Invalid schedule input')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(AnnouncementIdempotentWriteOptionsSchema, options, 'Invalid schedule options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'POST',
      url: `${announcementPath(announcementId)}/schedule`,
      data: parsedInput.data,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    AnnouncementSchema,
  )
}

export async function withdrawAnnouncement(
  announcementId: string,
  options: AdminIdempotentWriteOptions,
): Promise<Result<AdminAnnouncement>> {
  const parsedOptions = parseInput(AnnouncementIdempotentWriteOptionsSchema, options, 'Invalid withdraw options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'POST',
      url: `${announcementPath(announcementId)}/withdraw`,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    AnnouncementSchema,
  )
}

export async function duplicateAnnouncement(
  announcementId: string,
  options: { idempotencyKey: string },
): Promise<Result<AdminAnnouncement>> {
  const parsedOptions = parseInput(AnnouncementIdempotencyOptionsSchema, options, 'Invalid duplicate options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'POST',
      url: `${announcementPath(announcementId)}/duplicate`,
      headers: { 'Idempotency-Key': parsedOptions.data.idempotencyKey },
    },
    AnnouncementSchema,
  )
}
