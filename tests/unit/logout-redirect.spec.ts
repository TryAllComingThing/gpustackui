import { describe, expect, it } from 'vitest'
import { resolveLogoutRedirect } from '../../src/services/auth/logout'

describe('logout redirect contract', () => {
  it('accepts only absolute HTTPS logout URLs without credentials', () => {
    const trusted = ['https://idp.example.com']
    expect(resolveLogoutRedirect({ logout_url: 'https://idp.example.com/logout?client=gpustack' }, trusted)).toBe('https://idp.example.com/logout?client=gpustack')
    expect(resolveLogoutRedirect({ logout_url: 'http://idp.example.com/logout' }, trusted)).toBeNull()
    expect(resolveLogoutRedirect({ logout_url: 'javascript:alert(1)' }, trusted)).toBeNull()
    expect(resolveLogoutRedirect({ logout_url: 'https://user:pass@idp.example.com/logout' }, trusted)).toBeNull()
  })

  it('supports an empty logout response', () => {
    expect(resolveLogoutRedirect('', ['https://idp.example.com'])).toBeNull()
    expect(resolveLogoutRedirect({ logout_url: null }, ['https://idp.example.com'])).toBeNull()
  })

  it('rejects untrusted HTTPS origins and accepts only configured origins', () => {
    expect(resolveLogoutRedirect({ logout_url: 'https://evil.example/logout' }, ['https://idp.example.com'])).toBeNull()
    expect(resolveLogoutRedirect({ logout_url: 'https://idp.example.com.evil.example/logout' }, ['https://idp.example.com'])).toBeNull()
    expect(resolveLogoutRedirect({ logout_url: 'https://idp.example.com/logout' }, [' https://idp.example.com/ '])).toBe('https://idp.example.com/logout')
  })
})
