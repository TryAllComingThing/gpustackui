import { describe, expect, it } from 'vitest'
import { AuthUserSchema, type AuthUser } from '../../src/api/auth'
import { evaluateRouteAccess } from '../../src/app/router/access'
import { hasPermission } from '../../src/services/auth/permissions'

const admin: AuthUser = AuthUserSchema.parse({
  id: 1,
  username: 'admin',
  is_admin: true,
  is_active: true,
  source: 'Local',
})

const member: AuthUser = AuthUserSchema.parse({
  id: 2,
  username: 'member',
  is_admin: false,
  is_active: true,
  source: 'Local',
})

describe('GPUStack auth and route access contract', () => {
  it('parses the /v2/users/me response shape', () => {
    expect(admin.username).toBe('admin')
    expect(admin.is_admin).toBe(true)
  })

  it('uses is_admin as the only verified elevated permission', () => {
    expect(hasPermission(admin, 'admin')).toBe(true)
    expect(hasPermission(member, 'admin')).toBe(false)
    expect(hasPermission(member, 'authenticated')).toBe(true)
    expect(hasPermission(null, 'authenticated')).toBe(false)
  })

  it('allows public routes without a user', () => {
    expect(evaluateRouteAccess({}, null)).toBe('allow')
  })

  it('requires login for protected routes and fails closed for missing admin rights', () => {
    expect(evaluateRouteAccess({ requiresAuth: true }, null)).toBe('login')
    expect(evaluateRouteAccess({ requiresAuth: true }, member)).toBe('allow')
    expect(evaluateRouteAccess({ requiresAdmin: true }, member)).toBe('forbidden')
    expect(evaluateRouteAccess({ requiresAdmin: true }, admin)).toBe('allow')
  })

  it('requires every declared permission', () => {
    expect(evaluateRouteAccess({ permissions: ['authenticated', 'admin'] }, member)).toBe('forbidden')
    expect(evaluateRouteAccess({ permissions: ['authenticated', 'admin'] }, admin)).toBe('allow')
  })
})
