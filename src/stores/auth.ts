import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser } from '../types/auth'
import { clearToken, getStoredUser, getToken, setStoredUser, setToken } from '../services/auth/session'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const user = ref<AuthUser | null>(getStoredUser())
  const isAuthenticated = computed(() => Boolean(token.value))

  function hasPermission(permission: string) {
    return Boolean(user.value?.permissions.includes(permission))
  }

  function setSession(nextToken: string, nextUser: AuthUser) {
    token.value = nextToken
    user.value = nextUser
    setToken(nextToken)
    setStoredUser(nextUser)
  }

  function clear() {
    token.value = null
    user.value = null
    clearToken()
  }

  return { token, user, isAuthenticated, hasPermission, setSession, clear }
})
