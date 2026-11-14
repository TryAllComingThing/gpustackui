import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PREFERENCE_STORAGE_KEYS,
  readMigratedPreference,
  readStoredPreference,
  writeStoredPreference,
} from '../../src/utils/preferences'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

describe('preference storage migration', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))
  afterEach(() => vi.unstubAllGlobals())

  it('migrates a legacy key once and removes the obsolete entry', () => {
    localStorage.setItem('gpustack-theme', 'ocean')

    expect(readStoredPreference('theme')).toBe('ocean')
    expect(localStorage.getItem(PREFERENCE_STORAGE_KEYS.theme)).toBe('ocean')
    expect(localStorage.getItem('gpustack-theme')).toBeNull()
  })

  it('prefers the current key and still cleans stale legacy keys', () => {
    localStorage.setItem('vue-saas-density', 'compact')
    localStorage.setItem('gpustack-density', 'comfortable')

    expect(readStoredPreference('density')).toBe('compact')
    expect(localStorage.getItem('gpustack-density')).toBeNull()
  })

  it('writes new preference keys without restoring legacy entries', () => {
    writeStoredPreference('appearance', 'dark')

    expect(localStorage.getItem('vue-saas-appearance')).toBe('dark')
    expect(localStorage.getItem('gpustack-theme')).toBeNull()
  })

  it('returns null when storage access throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    })

    expect(readMigratedPreference('vue-saas-theme')).toBeNull()
  })
})
