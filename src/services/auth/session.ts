import type { AuthUser } from '../../types/auth'

const USER_KEY = 'gpustack-auth-user'

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

export function clearStoredUser() {
  if (typeof localStorage === 'undefined') return
  try { localStorage.removeItem(USER_KEY) } catch { /* ignore blocked storage */ }
}
