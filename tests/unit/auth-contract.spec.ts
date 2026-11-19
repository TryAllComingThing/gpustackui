import { describe, expect, it } from 'vitest'
import { AuthUserSchema, type AuthUser } from '../../src/api/auth'
import { evaluateRouteAccess } from '../../src/app/router/access'
import { hasPermission } from '../../src/services/auth/permissions'

const admin: AuthUser = AuthUserSchema.parse({
  id: 1,
  username: 'admin',
  is_admin: true,
  is_active: true,
  require_password_change: false,
  source: 'Local',
})

const member: AuthUser = AuthUserSchema.parse({
  id: 2,
  username: 'member',
  is_admin: false,
  is_active: true,
  require_password_change: false,
  source: 'Local',
})

describe('GPUStack auth and route access contract', () => {
  it('parses the /users/me response shape', () => {
    expect(admin.username).toBe('admin')
    expect(admin.is_admin).toBe(true)
  })

  it('rejects schemas that omit security-relevant user fields', () => {
    const withoutActive = { id: 1, username: 'admin', is_admin: true, require_password_change: false }
    const withoutPasswordFlag = { id: 1, username: 'admin', is_admin: true, is_active: true }
    expect(AuthUserSchema.safeParse(withoutActive).success).toBe(false)
    expect(AuthUserSchema.safeParse(withoutPasswordFlag).success).toBe(false)
  })

  it('uses is_admin as the only verified elevated permission', () => {
    expect(hasPermission(admin, 'admin')).toBe(true)
    expect(hasPermission(member, 'admin')).toBe(false)
    expect(hasPermission(member, 'authenticated')).toBe(true)
    expect(hasPermission(null, 'authenticated')).toBe(false)
  })

  it('allows only explicitly public routes without a user', () => {
    expect(evaluateRouteAccess({ public: true }, null)).toBe('allow')
    expect(evaluateRouteAccess({}, null)).toBe('login')
    expect(evaluateRouteAccess({}, admin)).toBe('login')
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

  it('fails closed for inactive and password-change-pending accounts', () => {
    const inactive = { ...member, is_active: false }
    const passwordChange = { ...member, require_password_change: true }
    expect(hasPermission(inactive, 'authenticated')).toBe(false)
    expect(hasPermission(passwordChange, 'authenticated')).toBe(false)
    expect(evaluateRouteAccess({ requiresAuth: true }, inactive)).toBe('forbidden')
    expect(evaluateRouteAccess({ requiresAuth: true }, passwordChange)).toBe('forbidden')
  })

  it('fails closed when security fields are absent at runtime', () => {
    const missingActive = { ...member, is_active: undefined } as unknown as AuthUser
    const missingPasswordFlag = { ...member, require_password_change: undefined } as unknown as AuthUser
    expect(hasPermission(missingActive, 'authenticated')).toBe(false)
    expect(hasPermission(missingPasswordFlag, 'authenticated')).toBe(false)
    expect(evaluateRouteAccess({ requiresAuth: true }, missingActive)).toBe('forbidden')
    expect(evaluateRouteAccess({ requiresAuth: true }, missingPasswordFlag)).toBe('forbidden')
  })

  it('rejects route metadata that marks a protected route as public', () => {
    expect(evaluateRouteAccess({ public: true, requiresAuth: true }, admin)).toBe('forbidden')
    expect(evaluateRouteAccess({ public: true, requiresAdmin: true }, null)).toBe('forbidden')
  })
})
