import type { ZodType } from 'zod'
import { requestValidated, type Result } from '../../services/http'
import type { DictionaryEntry, DictionaryType } from '../../types/admin'
import {
  adminIdempotentWriteHeaders,
  adminResourcePath,
  adminWriteHeaders,
  type AdminIdempotentWriteOptions,
  type AdminWriteOptions,
} from '../shared/admin'
import {
  DictionaryCacheRefreshInputSchema,
  DictionaryCacheRefreshResponseSchema,
  DictionaryDefaultEntryInputSchema,
  DictionaryEntryCreateInputSchema,
  DictionaryEntryListResponseSchema,
  DictionaryEntrySchema,
  DictionaryEntryUpdateInputSchema,
  DictionaryIdempotentWriteOptionsSchema,
  DictionaryStatusInputSchema,
  DictionaryTypeCreateInputSchema,
  DictionaryTypeListQuerySchema,
  DictionaryTypeListResponseSchema,
  DictionaryTypeSchema,
  DictionaryTypeUpdateInputSchema,
  DictionaryVersionOptionsSchema,
  type DictionaryCacheRefreshResponse,
  type DictionaryEntryCreateInput,
  type DictionaryEntryListResponse,
  type DictionaryEntryUpdateInput,
  type DictionaryStatusInput,
  type DictionaryTypeCreateInput,
  type DictionaryTypeListQuery,
  type DictionaryTypeListResponse,
  type DictionaryTypeUpdateInput,
} from './schema'

export const DICTIONARIES_PATH = '/dictionaries'
export const DICTIONARY_TYPES_PATH = `${DICTIONARIES_PATH}/types`
export const DICTIONARY_ENTRIES_PATH = `${DICTIONARIES_PATH}/entries`
export const DICTIONARY_CACHE_REFRESH_PATH = `${DICTIONARIES_PATH}/cache/refresh`

function validationFailure<T>(message: string, details: unknown): Result<T> {
  return { ok: false, error: { code: 'VALIDATION', message, details } }
}

function parseInput<T>(schema: ZodType<T>, input: unknown, message: string): Result<T> {
  const parsed = schema.safeParse(input)
  return parsed.success ? { ok: true, data: parsed.data } : validationFailure(message, parsed.error.issues)
}

function typePath(typeId: string): string {
  return adminResourcePath(DICTIONARY_TYPES_PATH, typeId)
}

function entryPath(entryId: string): string {
  return adminResourcePath(DICTIONARY_ENTRIES_PATH, entryId)
}

export async function listDictionaryTypes(
  params: DictionaryTypeListQuery = {},
  options: { signal?: AbortSignal } = {},
): Promise<Result<DictionaryTypeListResponse>> {
  const query = parseInput(DictionaryTypeListQuerySchema, params, 'Invalid dictionary type query')
  if (!query.ok) return query
  return requestValidated(
    {
      method: 'GET',
      url: DICTIONARY_TYPES_PATH,
      params: {
        ...(query.data.page !== undefined ? { page: query.data.page } : {}),
        ...(query.data.perPage !== undefined ? { per_page: query.data.perPage } : {}),
        ...(query.data.search?.trim() ? { search: query.data.search.trim() } : {}),
        ...(query.data.status !== undefined ? { status: query.data.status } : {}),
      },
      ...(options.signal ? { signal: options.signal } : {}),
    },
    DictionaryTypeListResponseSchema,
  )
}

export function listDictionaryEntries(
  typeId: string,
  options: { signal?: AbortSignal } = {},
): Promise<Result<DictionaryEntryListResponse>> {
  return requestValidated(
    {
      method: 'GET',
      url: `${typePath(typeId)}/entries`,
      params: { per_page: 100 },
      ...(options.signal ? { signal: options.signal } : {}),
    },
    DictionaryEntryListResponseSchema,
  )
}

export async function createDictionaryType(
  input: DictionaryTypeCreateInput,
  idempotencyKey: string,
): Promise<Result<DictionaryType>> {
  const parsedInput = parseInput(DictionaryTypeCreateInputSchema, input, 'Invalid dictionary type input')
  if (!parsedInput.ok) return parsedInput
  return requestValidated(
    {
      method: 'POST',
      url: DICTIONARY_TYPES_PATH,
      data: parsedInput.data,
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    DictionaryTypeSchema,
  )
}

export async function updateDictionaryType(
  typeId: string,
  input: DictionaryTypeUpdateInput,
  options: AdminWriteOptions,
): Promise<Result<DictionaryType>> {
  const parsedInput = parseInput(DictionaryTypeUpdateInputSchema, input, 'Invalid dictionary type update')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(DictionaryVersionOptionsSchema, options, 'Invalid dictionary type version')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: typePath(typeId),
      data: parsedInput.data,
      headers: adminWriteHeaders(parsedOptions.data.version),
    },
    DictionaryTypeSchema,
  )
}

export async function updateDictionaryTypeStatus(
  typeId: string,
  input: DictionaryStatusInput,
  options: AdminIdempotentWriteOptions,
): Promise<Result<DictionaryType>> {
  const parsedInput = parseInput(DictionaryStatusInputSchema, input, 'Invalid dictionary type status')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(DictionaryIdempotentWriteOptionsSchema, options, 'Invalid dictionary type options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: `${typePath(typeId)}/status`,
      data: parsedInput.data,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    DictionaryTypeSchema,
  )
}

export async function createDictionaryEntry(
  typeId: string,
  input: DictionaryEntryCreateInput,
  idempotencyKey: string,
): Promise<Result<DictionaryEntry>> {
  const parsedInput = parseInput(DictionaryEntryCreateInputSchema, input, 'Invalid dictionary entry input')
  if (!parsedInput.ok) return parsedInput
  return requestValidated(
    {
      method: 'POST',
      url: `${typePath(typeId)}/entries`,
      data: parsedInput.data,
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    DictionaryEntrySchema,
  )
}

export async function updateDictionaryEntry(
  entryId: string,
  input: DictionaryEntryUpdateInput,
  options: AdminWriteOptions,
): Promise<Result<DictionaryEntry>> {
  const parsedInput = parseInput(DictionaryEntryUpdateInputSchema, input, 'Invalid dictionary entry update')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(DictionaryVersionOptionsSchema, options, 'Invalid dictionary entry version')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: entryPath(entryId),
      data: parsedInput.data,
      headers: adminWriteHeaders(parsedOptions.data.version),
    },
    DictionaryEntrySchema,
  )
}

export async function updateDictionaryEntryStatus(
  entryId: string,
  input: DictionaryStatusInput,
  options: AdminIdempotentWriteOptions,
): Promise<Result<DictionaryEntry>> {
  const parsedInput = parseInput(DictionaryStatusInputSchema, input, 'Invalid dictionary entry status')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(DictionaryIdempotentWriteOptionsSchema, options, 'Invalid dictionary entry options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'PATCH',
      url: `${entryPath(entryId)}/status`,
      data: parsedInput.data,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    DictionaryEntrySchema,
  )
}

export async function setDefaultDictionaryEntry(
  typeId: string,
  input: { entryId: string },
  options: AdminIdempotentWriteOptions,
): Promise<Result<DictionaryEntry>> {
  const parsedInput = parseInput(DictionaryDefaultEntryInputSchema, { entry_id: input.entryId }, 'Invalid default dictionary entry')
  if (!parsedInput.ok) return parsedInput
  const parsedOptions = parseInput(DictionaryIdempotentWriteOptionsSchema, options, 'Invalid default entry options')
  if (!parsedOptions.ok) return parsedOptions
  return requestValidated(
    {
      method: 'POST',
      url: `${typePath(typeId)}/default-entry`,
      data: parsedInput.data,
      headers: adminIdempotentWriteHeaders(parsedOptions.data.version, parsedOptions.data.idempotencyKey),
    },
    DictionaryEntrySchema,
  )
}

export function refreshDictionaryCache(typeId: string, idempotencyKey: string): Promise<Result<DictionaryCacheRefreshResponse>> {
  return requestValidated(
    {
      method: 'POST',
      url: DICTIONARY_CACHE_REFRESH_PATH,
      data: { type_id: typeId },
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    DictionaryCacheRefreshResponseSchema,
  ).then((result) => result.ok ? { ok: true, data: result.data } : result)
}

void DictionaryCacheRefreshInputSchema
