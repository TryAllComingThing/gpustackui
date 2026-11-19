import type { AdminStatus } from '../../types/admin'
import type { DictionaryEntryFixture, DictionaryTypeFixture } from './fixtures/dictionaries'

export function filterDictionaryTypes(types: DictionaryTypeFixture[], search: string, status: AdminStatus | 'all'): DictionaryTypeFixture[] {
  const query = search.trim().toLowerCase()
  return types.filter((type) => (status === 'all' || type.status === status)
    && (!query || `${type.code} ${type.name} ${type.description}`.toLowerCase().includes(query)))
}

export function entriesForType(entries: DictionaryEntryFixture[], typeId: string): DictionaryEntryFixture[] {
  return entries.filter((entry) => entry.type_id === typeId)
    .sort((left, right) => left.sort_order - right.sort_order || left.code.localeCompare(right.code))
}

export function canDeactivateDictionaryType(entries: DictionaryEntryFixture[], typeId: string): { ok: true } | { ok: false; reason: 'activeEntries' } {
  return entries.some((entry) => entry.type_id === typeId && entry.status === 'active')
    ? { ok: false, reason: 'activeEntries' }
    : { ok: true }
}

export function canDeactivateDictionaryEntry(
  entry: DictionaryEntryFixture,
  entries: DictionaryEntryFixture[],
): { ok: true } | { ok: false; reason: 'defaultEntry' | 'alreadyInactive' } {
  if (entry.status === 'inactive') return { ok: false, reason: 'alreadyInactive' }
  const hasOtherActiveEntry = entries.some((candidate) => candidate.type_id === entry.type_id
    && candidate.id !== entry.id
    && candidate.status === 'active')
  if (entry.is_default && hasOtherActiveEntry) return { ok: false, reason: 'defaultEntry' }
  return { ok: true }
}

export function validateDictionaryDefaultState(status: AdminStatus, isDefault: boolean): { ok: true } | { ok: false; reason: 'inactiveDefault' } {
  if (isDefault && status !== 'active') return { ok: false, reason: 'inactiveDefault' }
  return { ok: true }
}

export function setDefaultDictionaryEntry(entries: DictionaryEntryFixture[], typeId: string, entryId: string): DictionaryEntryFixture[] {
  const target = entries.find((entry) => entry.type_id === typeId && entry.id === entryId)
  if (!target || target.status !== 'active') return entries
  return entries.map((entry) => entry.type_id === typeId ? { ...entry, is_default: entry.id === entryId } : entry)
}

export function normalizeDictionaryCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
}
