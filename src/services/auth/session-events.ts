import { currentAuthEpoch } from './request-epoch'

export interface SessionNavigationHandlers {
  onUnauthorized: () => void | Promise<void>
  onForbidden: () => void | Promise<void>
}

let handlers: SessionNavigationHandlers | null = null
let pendingNavigation: Promise<void> | null = null
let activeKind: 'unauthorized' | 'forbidden' | null = null
let unauthorizedQueued: { epoch?: number } | null = null
let forbiddenQueued: { epoch?: number } | null = null

export function registerSessionNavigationHandlers(next: SessionNavigationHandlers | null) {
  handlers = next
}

function notify(kind: keyof SessionNavigationHandlers): Promise<void> {
  const handler = handlers?.[kind]
  if (!handler) return Promise.resolve()
  return Promise.resolve().then(handler).catch(() => { /* navigation failures are reported by the router */ })
}

function isCurrentEpoch(epoch?: number): boolean {
  return epoch === undefined || epoch === currentAuthEpoch()
}

async function flushNavigation(): Promise<void> {
  while (unauthorizedQueued || forbiddenQueued) {
    if (unauthorizedQueued) {
      const event = unauthorizedQueued
      unauthorizedQueued = null
      forbiddenQueued = null
      activeKind = 'unauthorized'
      if (isCurrentEpoch(event.epoch)) await notify('onUnauthorized')
    } else {
      const event = forbiddenQueued
      forbiddenQueued = null
      activeKind = 'forbidden'
      if (event && isCurrentEpoch(event.epoch)) await notify('onForbidden')
    }
    activeKind = null
  }
}

function enqueue(kind: 'unauthorized' | 'forbidden', epoch?: number): Promise<void> {
  if (kind === 'unauthorized') {
    forbiddenQueued = null
    if (activeKind !== 'unauthorized') unauthorizedQueued = { epoch }
  } else if (!unauthorizedQueued && activeKind === null) {
    forbiddenQueued = { epoch }
  }
  if (!pendingNavigation) {
    pendingNavigation = flushNavigation().finally(() => {
      pendingNavigation = null
    })
  }
  return pendingNavigation
}

export function notifyUnauthorized(epoch?: number): Promise<void> {
  if (!isCurrentEpoch(epoch)) return Promise.resolve()
  return enqueue('unauthorized', epoch)
}

export function notifyForbidden(epoch?: number): Promise<void> {
  if (!isCurrentEpoch(epoch)) return Promise.resolve()
  return enqueue('forbidden', epoch)
}

export function resetSessionNavigationState() {
  handlers = null
  pendingNavigation = null
  activeKind = null
  unauthorizedQueued = null
  forbiddenQueued = null
}
