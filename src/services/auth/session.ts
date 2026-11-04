import type { AuthUser } from '../../types/auth'

const TOKEN_KEY = 'gpustack-auth-token'
const USER_KEY = 'gpustack-auth-user'

export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setToken(token: string) {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* ignore blocked storage */ }
}

export function clearToken() {
  if (typeof localStorage === 'undefined') return
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY) } catch { /* ignore blocked storage */ }
}

export function getStoredUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) as AuthUser : null
  } catch { return null }
}

export function setStoredUser(user: AuthUser) {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)) } catch { /* ignore blocked storage */ }
}
