import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AuthUserSchema, type AuthUser } from '../types/auth'
import { login as loginRequest, logout as logoutRequest, type LogoutResponse } from '../api/auth'
import type { ApiError, Result } from '../services/http'
import { abandonPendingSession, clearLegacyAuthCache, confirmSession } from '../services/auth/session'
import { hasPermission as checkPermission, type AuthPermission } from '../services/auth/permissions'
import { advanceAuthEpoch } from '../services/auth/request-epoch'

export type AuthStatus = 'unknown' | 'checking' | 'authenticated' | 'anonymous' | 'unavailable'

export const useAuthStore = defineStore('auth', () => {
  clearLegacyAuthCache()
  const user = ref<AuthUser | null>(null)
  const status = ref<AuthStatus>('unknown')
  const lastError = ref<ApiError | null>(null)
  let authGeneration = advanceAuthEpoch()
  let pendingSession: { generation: number; promise: Promise<Result<AuthUser>> } | null = null
  const isLoading = computed(() => status.value === 'checking')
  const isAuthenticated = computed(() => status.value === 'authenticated' && user.value !== null)
  const isAdmin = computed(() => isAuthenticated.value && user.value?.is_admin === true)

  function hasPermission(permission: AuthPermission) {
    return isAuthenticated.value && checkPermission(user.value, permission)
  }

  function inactiveError(): ApiError {
    return { code: 'FORBIDDEN', message: 'User account is inactive' }
  }

  function invalidUserError(): ApiError {
    return { code: 'VALIDATION', message: 'Session user payload failed validation' }
  }

  function canceledResult(): Result<AuthUser> {
    return { ok: false, error: { code: 'CANCELED', message: 'Session check was superseded by a newer authentication transition' } }
  }

  function invalidateAuthRequests(): number {
    authGeneration = advanceAuthEpoch()
    pendingSession = null
    abandonPendingSession()
    return authGeneration
  }

  function setUser(nextUser: AuthUser): boolean {
    const parsed = AuthUserSchema.safeParse(nextUser)
    if (!parsed.success || parsed.data.is_active !== true || parsed.data.require_password_change !== false) {
      invalidateAuthRequests()
      user.value = null
      status.value = 'anonymous'
      lastError.value = parsed.success ? inactiveError() : invalidUserError()
      return false
    }
    user.value = parsed.data
    status.value = 'authenticated'
    lastError.value = null
    return true
  }

  function clear() {
    invalidateAuthRequests()
    clearLegacyAuthCache()
    user.value = null
    status.value = 'anonymous'
    lastError.value = null
  }

  function handleUnauthorized() {
    invalidateAuthRequests()
    user.value = null
    status.value = 'anonymous'
    lastError.value = { code: 'UNAUTHORIZED', message: 'Session is no longer valid' }
  }

  function anonymousResult(): Result<AuthUser> {
    return {
      ok: false,
      error: lastError.value ?? { code: 'UNAUTHORIZED', message: 'Session confirmation required' },
    }
  }

  async function ensureSession(options: { force?: boolean } = {}): Promise<Result<AuthUser>> {
    if (!options.force && isAuthenticated.value && user.value) return { ok: true, data: user.value }
    if (!options.force && status.value === 'anonymous') return anonymousResult()
    if (pendingSession) return pendingSession.promise

    const generation = advanceAuthEpoch()
    authGeneration = generation
    status.value = 'checking'
    const promise = (async (): Promise<Result<AuthUser>> => {
      const result = await confirmSession()
      if (generation !== authGeneration) return canceledResult()
      if (result.ok) {
        return setUser(result.data) ? result : { ok: false, error: lastError.value ?? inactiveError() }
      }

      lastError.value = result.error
      if (result.error.code === 'UNAUTHORIZED') {
        user.value = null
        status.value = 'anonymous'
      } else if (result.error.code === 'FORBIDDEN' && user.value) {
        status.value = 'authenticated'
      } else if (result.error.code === 'FORBIDDEN') {
        user.value = null
        status.value = 'anonymous'
      } else {
        user.value = null
        status.value = 'unavailable'
      }
      return result
    })()
    const entry = { generation, promise }
    pendingSession = entry
    const clearPending = () => {
      if (pendingSession === entry) pendingSession = null
    }
    void promise.then(clearPending, clearPending)
    return promise
  }

  async function refresh(): Promise<Result<AuthUser>> {
    return ensureSession({ force: true })
  }

  async function login(username: string, password: string): Promise<Result<AuthUser>> {
    const generation = invalidateAuthRequests()
    const result = await loginRequest(username, password)
    if (generation !== authGeneration) return canceledResult()
    if (!result.ok) {
      user.value = null
      status.value = 'anonymous'
      lastError.value = result.error
      return result
    }
    return ensureSession({ force: true })
  }

  async function logout(): Promise<Result<LogoutResponse>> {
    const generation = invalidateAuthRequests()
    const result = await logoutRequest()
    if (generation !== authGeneration) {
      return { ok: false, error: { code: 'CANCELED', message: 'Logout was superseded by a newer authentication transition' } }
    }
    if (result.ok || result.error.code === 'UNAUTHORIZED') clear()
    else lastError.value = result.error
    return result
  }

  return {
    user,
    status,
    lastError,
    isLoading,
    isAuthenticated,
    isAdmin,
    hasPermission,
    setUser,
    ensureSession,
    refresh,
    login,
    logout,
    clear,
    handleUnauthorized,
  }
})
