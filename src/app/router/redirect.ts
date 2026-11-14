const DEFAULT_REDIRECT = '/dashboard'

export function resolvePostLoginRedirect(value: unknown, fallback = DEFAULT_REDIRECT): string {
  const candidate = Array.isArray(value) ? value[0] : value
  if (typeof candidate !== 'string') return fallback
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return fallback
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return fallback
  if (candidate === '/login' || candidate.startsWith('/login?') || candidate.startsWith('/403')) return fallback
  return candidate
}
