import { z } from 'zod'
import { authHttp, requestValidatedWithClient, type Result } from '../../services/http'
import { AuthUserSchema, type AuthUser } from './user'

export const AuthConfigSchema = z.object({
  is_saml: z.boolean().optional(),
  is_oidc: z.boolean().optional(),
  first_time_setup: z.boolean().optional(),
  get_initial_password_command: z.string().optional(),
})

export const LogoutResponseSchema = z.union([
  z.object({ logout_url: z.string().nullable().optional() }),
  z.literal(''),
])

export const EmptyResponseSchema = z.union([z.literal(''), z.null()])

export type AuthConfig = z.infer<typeof AuthConfigSchema>
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>

export function login(username: string, password: string): Promise<Result<void>> {
  const body = new URLSearchParams({ username, password })
  return requestValidatedWithClient(
    authHttp,
    {
      method: 'POST',
      url: '/auth/login',
      data: body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
    EmptyResponseSchema,
  ).then((result) => result.ok ? { ok: true, data: undefined } : result)
}

export function logout(): Promise<Result<LogoutResponse>> {
  return requestValidatedWithClient(authHttp, { method: 'POST', url: '/auth/logout' }, LogoutResponseSchema)
}

export function getAuthConfig(): Promise<Result<AuthConfig>> {
  return requestValidatedWithClient(authHttp, { method: 'GET', url: '/auth/config' }, AuthConfigSchema)
}

export function updatePassword(currentPassword: string, newPassword: string): Promise<Result<null>> {
  return requestValidatedWithClient(
    authHttp,
    { method: 'POST', url: '/auth/update-password', data: { current_password: currentPassword, new_password: newPassword } },
    EmptyResponseSchema,
  ).then((result) => result.ok ? { ok: true, data: null } : result)
}

export function getCurrentUser(): Promise<Result<AuthUser>> {
  return requestValidatedWithClient(authHttp, { method: 'GET', url: '/v2/users/me' }, AuthUserSchema)
}
