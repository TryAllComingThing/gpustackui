import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import type { AuthUser } from '../../../src/api/auth'

vi.mock('../../../src/services/auth/session', () => ({
  abandonPendingSession: vi.fn(),
  clearLegacyAuthCache: vi.fn(),
  confirmSession: vi.fn(),
}))
vi.mock('../../../src/api/auth', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

import { confirmSession } from '../../../src/services/auth/session'
import { installAuthGuard } from '../../../src/app/router/guards'

const member: AuthUser = {
  id: 2,
  username: 'member',
  is_admin: false,
  is_active: true,
  require_password_change: false,
  source: 'Local',
}

const routes: RouteRecordRaw[] = [
  { path: '/dashboard', name: 'dashboard', component: {}, meta: { requiresAuth: true } },
  { path: '/protected', name: 'protected', component: {}, meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin', component: {}, meta: { requiresAdmin: true } },
  { path: '/login', name: 'login', component: {}, meta: { guestOnly: true } },
  { path: '/conflicting-login', name: 'conflicting-login', component: {}, meta: { guestOnly: true, requiresAuth: true } },
  { path: '/forbidden', name: 'forbidden', component: {}, meta: { public: true } },
  { path: '/unavailable', name: 'unavailable', component: {}, meta: { public: true } },
  { path: '/implicit', name: 'implicit', component: {} },
  { path: '/public', name: 'public', component: {}, meta: { public: true } },
]

function guardedRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  installAuthGuard(router, {
    loginRouteName: 'login',
    defaultRouteName: 'dashboard',
    forbiddenRouteName: 'forbidden',
    unavailableRouteName: 'unavailable',
  })
  return router
}

describe('auth router guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(confirmSession).mockReset()
  })

  it('confirms the server session before redirecting an anonymous protected navigation', async () => {
    vi.mocked(confirmSession).mockResolvedValue({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
    const router = guardedRouter()

    await router.push('/protected?view=compact')
    expect(confirmSession).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/protected?view=compact')
  })

  it('redirects an authenticated guest away from the login page', async () => {
    vi.mocked(confirmSession).mockResolvedValue({ ok: true, data: member })
    const router = guardedRouter()

    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('fails closed for admin-only routes without clearing the authenticated session', async () => {
    vi.mocked(confirmSession).mockResolvedValue({ ok: true, data: member })
    const router = guardedRouter()

    await router.push('/admin')
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('keeps an anonymous user on the login route without redirecting back to itself', async () => {
    vi.mocked(confirmSession).mockResolvedValue({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
    const router = guardedRouter()

    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('fails closed when guest-only metadata also declares protected access', async () => {
    const router = guardedRouter()

    await router.push('/conflicting-login')
    expect(router.currentRoute.value.name).toBe('forbidden')
    expect(confirmSession).not.toHaveBeenCalled()
  })

  it('preserves a confirmed session when a later refresh returns 403', async () => {
    vi.mocked(confirmSession).mockResolvedValue({ ok: true, data: member })
    const router = guardedRouter()
    await router.push('/protected')

    vi.mocked(confirmSession).mockResolvedValue({ ok: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } })
    await router.push('/dashboard')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('fails closed when authenticated route metadata omits explicit access declarations', async () => {
    vi.mocked(confirmSession).mockResolvedValue({ ok: true, data: member })
    const router = guardedRouter()

    await router.push('/implicit')
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('allows explicitly public routes without confirming a session', async () => {
    const router = guardedRouter()

    await router.push('/public')
    expect(router.currentRoute.value.name).toBe('public')
    expect(confirmSession).not.toHaveBeenCalled()
  })

  it('routes server errors to unavailable instead of login', async () => {
    vi.mocked(confirmSession).mockResolvedValue({ ok: false, error: { code: 'SERVER', message: 'down' } })
    const router = guardedRouter()

    await router.push('/protected')
    expect(router.currentRoute.value.name).toBe('unavailable')
    expect(router.currentRoute.value.query.redirect).toBe('/protected')
  })

  it('keeps session-probe 403 distinct from an unauthenticated redirect', async () => {
    vi.mocked(confirmSession).mockResolvedValue({ ok: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } })
    const router = guardedRouter()

    await router.push('/protected')
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('aborts superseded session confirmations without a misleading redirect', async () => {
    vi.mocked(confirmSession).mockResolvedValue({ ok: false, error: { code: 'CANCELED', message: 'superseded' } })
    const router = guardedRouter()
    await router.push('/public')
    await router.push('/protected')
    expect(router.currentRoute.value.name).toBe('public')
  })
})
