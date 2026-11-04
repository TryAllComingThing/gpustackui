import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser } from '../types/auth'
import { getCurrentUser, login as loginRequest, logout as logoutRequest, type LogoutResponse } from '../api/auth'
import type { Result } from '../services/http'
import { clearStoredUser, getStoredUser, setStoredUser } from '../services/auth/session'
import { hasPermission as checkPermission, type AuthPermission } from '../services/auth/permissions'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(getStoredUser())
  const isLoading = ref(false)
  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.is_admin === true)

  function hasPermission(permission: AuthPermission) {
    return checkPermission(user.value, permission)
  }

  function setUser(nextUser: AuthUser) {
    user.value = nextUser
    setStoredUser(nextUser)
  }

  function clear() {
    user.value = null
    clearStoredUser()
  }

  async function refresh(): Promise<Result<AuthUser>> {
    isLoading.value = true
    const result = await getCurrentUser()
    isLoading.value = false
    if (result.ok) {
      setUser(result.data)
    } else if (result.error.code === 'UNAUTHORIZED') {
      clear()
    }
    return result
  }

  async function login(username: string, password: string): Promise<Result<AuthUser>> {
    const result = await loginRequest(username, password)
    if (!result.ok) return result
    return refresh()
  }

  async function logout(): Promise<Result<LogoutResponse>> {
    const result = await logoutRequest()
    clear()
    return result
  }

  return { user, isLoading, isAuthenticated, isAdmin, hasPermission, setUser, refresh, login, logout, clear }
})
