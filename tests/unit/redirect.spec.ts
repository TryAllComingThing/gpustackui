import { describe, expect, it } from 'vitest'
import { resolvePostLoginRedirect } from '../../src/app/router/redirect'

describe('post-login redirect', () => {
  it('accepts internal paths', () => {
    expect(resolvePostLoginRedirect('/resources/gpus?page=2')).toBe('/resources/gpus?page=2')
  })

  it('rejects external, protocol-relative, login and forbidden targets', () => {
    expect(resolvePostLoginRedirect('https://evil.example')).toBe('/dashboard')
    expect(resolvePostLoginRedirect('//evil.example')).toBe('/dashboard')
    expect(resolvePostLoginRedirect('/\\evil.example')).toBe('/dashboard')
    expect(resolvePostLoginRedirect('/login?redirect=/dashboard')).toBe('/dashboard')
    expect(resolvePostLoginRedirect('/403')).toBe('/dashboard')
  })
})
