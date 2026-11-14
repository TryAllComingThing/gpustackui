import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { AuthUser } from '../../../src/api/auth'
import type { Result } from '../../../src/services/http'

vi.mock('../../../src/api/auth', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

import { getCurrentUser, login, logout } from '../../../src/api/auth'
import { useAuthStore } from '../../../src/stores/auth'

const admin: AuthUser = {
  id: 1,
  username: 'admin',
  is_admin: true,
  is_active: true,
  require_password_change: false,
  source: 'Local',
}

const unauthorized: Result<AuthUser> = {
  ok: false,
  error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
}

const forbidden: Result<AuthUser> = {
  ok: false,
  error: { code: 'FORBIDDEN', message: 'Forbidden' },
}

describe('auth session state machine', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(login).mockReset()
    vi.mocked(logout).mockReset()
  })

  it('deduplicates concurrent session confirmation and trusts only the server result', async () => {
    let resolveSession!: (result: Result<AuthUser>) => void
    let receivedSignal: AbortSignal | undefined
    vi.mocked(getCurrentUser).mockImplementation((options = {}) => {
      receivedSignal = options.signal
      return new Promise((resolve) => { resolveSession = resolve })
    })
    const auth = useAuthStore()

    expect(auth.status).toBe('unknown')
    const first = auth.ensureSession()
    const second = auth.ensureSession()
    expect(getCurrentUser).toHaveBeenCalledTimes(1)

    resolveSession({ ok: true, data: admin })
    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(auth.status).toBe('authenticated')
    expect(auth.user?.username).toBe('admin')
    expect(receivedSignal).toBeInstanceOf(AbortSignal)
  })

  it('deduplicates concurrent forced refreshes', async () => {
    let resolveSession!: (result: Result<AuthUser>) => void
    vi.mocked(getCurrentUser).mockReturnValue(new Promise((resolve) => { resolveSession = resolve }))
    const auth = useAuthStore()

    const first = auth.refresh()
    const second = auth.refresh()
    expect(getCurrentUser).toHaveBeenCalledTimes(1)

    resolveSession({ ok: true, data: admin })
    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(auth.status).toBe('authenticated')
  })

  it('clears confirmed identity on 401', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(unauthorized)
    const auth = useAuthStore()

    const result = await auth.ensureSession()
    expect(result.ok).toBe(false)
    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
    expect(auth.lastError?.code).toBe('UNAUTHORIZED')
  })

  it('keeps a confirmed identity when a forced refresh receives 403', async () => {
    const auth = useAuthStore()
    auth.setUser(admin)
    vi.mocked(getCurrentUser).mockResolvedValue(forbidden)

    const result = await auth.refresh()
    expect(result.ok).toBe(false)
    expect(auth.status).toBe('authenticated')
    expect(auth.user?.username).toBe('admin')
    expect(auth.lastError?.code).toBe('FORBIDDEN')
  })

  it('does not mark an unknown user as authenticated after a 403', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(forbidden)
    const auth = useAuthStore()

    await expect(auth.refresh()).resolves.toEqual(forbidden)
    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('marks an unconfirmed network failure as unavailable instead of authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ok: false, error: { code: 'NETWORK', message: 'offline' } })
    const auth = useAuthStore()

    const result = await auth.ensureSession()
    expect(result.ok).toBe(false)
    expect(auth.status).toBe('unavailable')
    expect(auth.user).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('drops a previously confirmed identity when a forced session check fails unexpectedly', async () => {
    const auth = useAuthStore()
    auth.setUser(admin)
    vi.mocked(getCurrentUser).mockResolvedValue({ ok: false, error: { code: 'SERVER', message: 'session probe failed' } })

    const result = await auth.refresh()
    expect(result.ok).toBe(false)
    expect(auth.status).toBe('unavailable')
    expect(auth.user).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('confirms identity after login and keeps it when logout cannot be confirmed', async () => {
    vi.mocked(login).mockResolvedValue({ ok: true, data: undefined })
    vi.mocked(getCurrentUser).mockResolvedValue({ ok: true, data: admin })
    const auth = useAuthStore()

    await expect(auth.login('admin', 'secret')).resolves.toEqual({ ok: true, data: admin })
    expect(auth.isAuthenticated).toBe(true)

    vi.mocked(logout).mockResolvedValue({ ok: false, error: { code: 'NETWORK', message: 'offline' } })
    await expect(auth.logout()).resolves.toMatchObject({ ok: false, error: { code: 'NETWORK' } })
    expect(auth.status).toBe('authenticated')
    expect(auth.user?.username).toBe('admin')
    expect(auth.lastError?.code).toBe('NETWORK')
  })

  it('clears identity when logout confirms that the session is already unauthorized', async () => {
    const auth = useAuthStore()
    auth.setUser(admin)
    vi.mocked(logout).mockResolvedValue({ ok: false, error: { code: 'UNAUTHORIZED', message: 'expired' } })

    await auth.logout()
    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
  })

  it('ignores a stale forced session response after a newer login completes', async () => {
    let resolveStale!: (result: Result<AuthUser>) => void
    vi.mocked(getCurrentUser).mockReturnValueOnce(new Promise((resolve) => { resolveStale = resolve }))
    vi.mocked(login).mockResolvedValue({ ok: true, data: undefined })
    const staleUser: AuthUser = { ...admin, id: 2, username: 'stale' }
    const auth = useAuthStore()

    const staleRequest = auth.refresh()
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ ok: true, data: admin })
    await auth.login('admin', 'secret')

    resolveStale({ ok: true, data: staleUser })
    await expect(staleRequest).resolves.toMatchObject({ ok: false, error: { code: 'CANCELED' } })
    expect(auth.user?.username).toBe('admin')
  })

  it('fails closed when the server returns an inactive account', () => {
    const auth = useAuthStore()
    auth.setUser({ ...admin, is_active: false })
    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
    expect(auth.lastError?.code).toBe('FORBIDDEN')
  })

  it('fails closed when a password change is still required', () => {
    const auth = useAuthStore()
    auth.setUser({ ...admin, require_password_change: true })
    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
    expect(auth.lastError?.code).toBe('FORBIDDEN')
  })

  it('fails closed when the user payload is malformed or omits security fields', () => {
    const auth = useAuthStore()
    auth.setUser({ ...admin, require_password_change: undefined } as unknown as AuthUser)
    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
    expect(auth.lastError?.code).toBe('VALIDATION')
  })

  it('aborts an in-flight session probe when the session is superseded', async () => {
    let receivedSignal: AbortSignal | undefined
    vi.mocked(getCurrentUser).mockImplementation((options = {}) => {
      receivedSignal = options.signal
      return new Promise(() => {})
    })
    const auth = useAuthStore()
    void auth.refresh()

    auth.clear()
    expect(receivedSignal?.aborted).toBe(true)
  })

  it('never persists the confirmed user to localStorage', () => {
    const setItem = vi.fn()
    const removeItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem, removeItem })
    const auth = useAuthStore()
    auth.setUser(admin)
    expect(setItem).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('removes both current and legacy auth cache keys on clear', () => {
    const removeItem = vi.fn()
    vi.stubGlobal('localStorage', { removeItem })
    const auth = useAuthStore()
    auth.clear()
    expect(removeItem).toHaveBeenCalledWith('gpustack-auth-user')
    expect(removeItem).toHaveBeenCalledWith('gpustack-auth-token')
    vi.unstubAllGlobals()
  })
})
