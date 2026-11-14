export const PREFERENCE_STORAGE_KEYS = {
  theme: 'vue-saas-theme',
  density: 'vue-saas-density',
  locale: 'vue-saas-locale',
  appearance: 'vue-saas-appearance',
} as const

export const LEGACY_PREFERENCE_STORAGE_KEYS = {
  theme: ['gpustack-theme'],
  density: ['gpustack-density'],
  locale: ['gpustack-locale'],
  appearance: [],
} as const

function browserStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

export function readMigratedPreference(key: string, legacyKeys: readonly string[] = []): string | null {
  const storage = browserStorage()
  if (!storage) return null
  try {
    const current = storage.getItem(key)
    if (current !== null) {
      for (const legacyKey of legacyKeys) storage.removeItem(legacyKey)
      return current
    }
    for (const legacyKey of legacyKeys) {
      const legacy = storage.getItem(legacyKey)
      if (legacy === null) continue
      storage.setItem(key, legacy)
      storage.removeItem(legacyKey)
      return legacy
    }
  } catch {
    return null
  }
  return null
}

export function writePreference(key: string, value: string): void {
  const storage = browserStorage()
  if (!storage) return
  try {
    storage.setItem(key, value)
  } catch {
    // Storage may be blocked by the browser or an embedded context.
  }
}

export function readStoredPreference(key: keyof typeof PREFERENCE_STORAGE_KEYS): string | null {
  return readMigratedPreference(PREFERENCE_STORAGE_KEYS[key], LEGACY_PREFERENCE_STORAGE_KEYS[key])
}

export function writeStoredPreference(key: keyof typeof PREFERENCE_STORAGE_KEYS, value: string): void {
  writePreference(PREFERENCE_STORAGE_KEYS[key], value)
}
