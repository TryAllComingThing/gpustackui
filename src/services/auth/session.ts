import { getCurrentUser } from '../../api/auth'
import type { AuthUser } from '../../types/auth'
import type { Result } from '../http'

const LEGACY_AUTH_KEYS = ['gpustack-auth-user', 'gpustack-auth-token'] as const
let pendingConfirmation: Promise<Result<AuthUser>> | null = null
let pendingController: AbortController | null = null

export function abandonPendingSession() {
  pendingController?.abort()
  pendingController = null
  pendingConfirmation = null
}

export function clearLegacyAuthCache() {
  if (typeof localStorage === 'undefined') return
  try {
    for (const key of LEGACY_AUTH_KEYS) localStorage.removeItem(key)
  } catch { /* storage may be blocked */ }
}

export function confirmSession(): Promise<Result<AuthUser>> {
  if (!pendingConfirmation) {
    const controller = typeof AbortController === 'undefined' ? null : new AbortController()
    pendingController = controller
    const request: Promise<Result<AuthUser>> = getCurrentUser({ signal: controller?.signal }).finally(() => {
      if (pendingConfirmation === request) pendingConfirmation = null
      if (pendingController === controller) pendingController = null
    })
    pendingConfirmation = request
  }
  return pendingConfirmation
}
