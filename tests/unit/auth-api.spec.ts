import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/services/http', () => ({
  authHttp: { id: 'auth-http' },
  hasCsrfToken: vi.fn(),
  isCsrfRequired: vi.fn(),
  requestValidated: vi.fn(),
  requestValidatedWithClient: vi.fn(),
  requestWithClient: vi.fn(),
}))

import { hasCsrfToken, isCsrfRequired, requestValidated, requestValidatedWithClient, requestWithClient } from '../../src/services/http'
import { AuthUserSchema } from '../../src/api/auth'
import { getCurrentUser, login, LogoutResponseSchema } from '../../src/api/auth/auth'

describe('auth API transport contract', () => {
  beforeEach(() => {
    vi.mocked(requestValidated).mockReset()
    vi.mocked(requestValidatedWithClient).mockReset()
    vi.mocked(requestWithClient).mockReset()
    vi.mocked(isCsrfRequired).mockReset().mockReturnValue(false)
    vi.mocked(hasCsrfToken).mockReset().mockReturnValue(false)
  })

  it('confirms the current user through the defined auth base URL contract', async () => {
    const user = { id: 1, username: 'admin', is_admin: true, is_active: true, require_password_change: false, source: 'Local' }
    vi.mocked(requestValidatedWithClient).mockResolvedValue({ ok: true, data: user })

    await expect(getCurrentUser()).resolves.toEqual({ ok: true, data: user })
    expect(requestValidatedWithClient).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'auth-http' }),
      { method: 'GET', url: '/v2/users/me' },
      AuthUserSchema,
    )
    expect(requestValidated).not.toHaveBeenCalled()
  })

  it('keeps credential endpoints on the auth base URL', async () => {
    vi.mocked(requestValidatedWithClient).mockResolvedValue({ ok: true, data: '' })

    await login('admin', 'secret')
    expect(requestValidatedWithClient).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'auth-http' }),
      expect.objectContaining({ method: 'POST', url: '/auth/login' }),
      expect.anything(),
    )
    expect(requestValidated).not.toHaveBeenCalled()
  })

  it('bootstraps a CSRF cookie before credential login in required mode', async () => {
    vi.mocked(isCsrfRequired).mockReturnValue(true)
    vi.mocked(hasCsrfToken).mockReturnValueOnce(false).mockReturnValueOnce(true)
    vi.mocked(requestWithClient).mockResolvedValue({ ok: true, data: {} })
    vi.mocked(requestValidatedWithClient).mockResolvedValue({ ok: true, data: '' })

    await expect(login('admin', 'secret')).resolves.toEqual({ ok: true, data: undefined })
    expect(requestWithClient).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'auth-http' }),
      { method: 'GET', url: '/auth/config' },
    )
    expect(requestValidatedWithClient).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'auth-http' }),
      expect.objectContaining({ method: 'POST', url: '/auth/login' }),
      expect.anything(),
    )
  })

  it('blocks credential login when CSRF bootstrap cannot provide a token', async () => {
    vi.mocked(isCsrfRequired).mockReturnValue(true)
    vi.mocked(hasCsrfToken).mockReturnValue(false)
    vi.mocked(requestWithClient).mockResolvedValue({ ok: true, data: {} })

    await expect(login('admin', 'secret')).resolves.toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'CSRF' }),
    })
    expect(requestValidatedWithClient).not.toHaveBeenCalled()
  })

  it('accepts only documented logout response shapes', () => {
    expect(LogoutResponseSchema.safeParse('').success).toBe(true)
    expect(LogoutResponseSchema.safeParse(null).success).toBe(true)
    expect(LogoutResponseSchema.safeParse({ logout_url: 'https://idp.example.com/logout' }).success).toBe(true)
    expect(LogoutResponseSchema.safeParse({ logout_url: null }).success).toBe(true)
    expect(LogoutResponseSchema.safeParse({ logout_url: 42 }).success).toBe(false)
    expect(LogoutResponseSchema.safeParse({ unexpected: true }).success).toBe(false)
    expect(LogoutResponseSchema.safeParse([]).success).toBe(false)
  })
})
