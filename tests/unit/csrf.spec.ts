import { AxiosHeaders } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyCsrfHeader, CsrfError, hasCsrfToken, isCsrfRequired, readCookieValue, readCsrfToken, shouldAttachCsrf } from '../../src/services/http/csrf'

describe('CSRF request policy', () => {
  it('attaches tokens only to state-changing methods', () => {
    expect(shouldAttachCsrf('POST')).toBe(true)
    expect(shouldAttachCsrf('PUT')).toBe(true)
    expect(shouldAttachCsrf('PATCH')).toBe(true)
    expect(shouldAttachCsrf('DELETE')).toBe(true)
    expect(shouldAttachCsrf('GET')).toBe(false)
    expect(shouldAttachCsrf('HEAD')).toBe(false)
  })

  it('reads a decoded CSRF cookie without exposing other cookies', () => {
    expect(readCookieValue('theme=standard; XSRF-TOKEN=a%20b; locale=zh-CN', 'XSRF-TOKEN')).toBe('a b')
    expect(readCookieValue('theme=standard', 'XSRF-TOKEN')).toBeNull()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requires CSRF in production and cannot disable it with an environment override', () => {
    expect(isCsrfRequired({ PROD: true })).toBe(true)
    expect(isCsrfRequired({ PROD: false })).toBe(false)
    expect(isCsrfRequired({ PROD: true, VITE_CSRF_REQUIRED: 'false' })).toBe(true)
    expect(isCsrfRequired({ PROD: false, VITE_CSRF_REQUIRED: 'true' })).toBe(true)
  })

  it('fails closed when production CSRF configuration or token is missing', () => {
    vi.stubGlobal('document', { cookie: '' })
    expect(() => applyCsrfHeader({ method: 'POST' }, { PROD: true })).toThrow(CsrfError)
    expect(() => applyCsrfHeader({ method: 'POST' }, { PROD: true, VITE_CSRF_COOKIE_NAME: 'XSRF-TOKEN' })).toThrow(CsrfError)
  })

  it('keeps optional CSRF mode backward compatible outside production', () => {
    vi.stubGlobal('document', { cookie: '' })
    expect(() => applyCsrfHeader({ method: 'DELETE' }, { PROD: false, VITE_CSRF_COOKIE_NAME: 'XSRF-TOKEN' })).not.toThrow()
  })

  it('attaches the configured cookie token to state-changing requests', () => {
    vi.stubGlobal('document', { cookie: 'theme=standard; XSRF-TOKEN=token-value' })
    const config = { method: 'PATCH', headers: new AxiosHeaders() }
    applyCsrfHeader(config, { PROD: true, VITE_CSRF_COOKIE_NAME: 'XSRF-TOKEN', VITE_CSRF_HEADER_NAME: 'X-CSRF-Token' })
    expect((config.headers as AxiosHeaders).get('X-CSRF-Token')).toBe('token-value')
  })

  it('detects a readable CSRF token without requiring a state-changing request', () => {
    vi.stubGlobal('document', { cookie: 'theme=standard; XSRF-TOKEN=token-value' })
    expect(readCsrfToken({ PROD: true, VITE_CSRF_COOKIE_NAME: 'XSRF-TOKEN' })).toBe('token-value')
    expect(hasCsrfToken({ PROD: true, VITE_CSRF_COOKIE_NAME: 'XSRF-TOKEN' })).toBe(true)
    expect(hasCsrfToken({ PROD: true, VITE_CSRF_COOKIE_NAME: 'MISSING' })).toBe(false)
  })

  it('treats empty or whitespace-only CSRF cookies as missing', () => {
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=; OTHER=value' })
    expect(readCsrfToken({ PROD: true, VITE_CSRF_COOKIE_NAME: 'XSRF-TOKEN' })).toBeNull()
    expect(hasCsrfToken({ PROD: true, VITE_CSRF_COOKIE_NAME: 'XSRF-TOKEN' })).toBe(false)

    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=%20%20' })
    expect(hasCsrfToken({ PROD: true, VITE_CSRF_COOKIE_NAME: 'XSRF-TOKEN' })).toBe(false)
  })
})
