import type { LogoutResponse } from '../../api/auth'

function normalizeOrigins(origins: readonly string[]): Set<string> {
  const normalized = new Set<string>()
  for (const value of origins) {
    try {
      const origin = new URL(value.trim()).origin
      if (origin !== 'null') normalized.add(origin)
    } catch { /* ignore invalid configuration entries */ }
  }
  return normalized
}

export function parseTrustedLogoutOrigins(value: string | undefined): string[] {
  return (value ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
}

export function resolveLogoutRedirect(
  response: LogoutResponse,
  trustedOrigins: readonly string[] = parseTrustedLogoutOrigins(import.meta.env.VITE_TRUSTED_LOGOUT_ORIGINS),
): string | null {
  if (typeof response !== 'object' || response === null) return null
  const value = response.logout_url
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.username || url.password) return null
    if (!normalizeOrigins(trustedOrigins).has(url.origin)) return null
    return url.href
  } catch {
    return null
  }
}
