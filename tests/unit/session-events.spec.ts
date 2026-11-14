import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  notifyForbidden,
  notifyUnauthorized,
  registerSessionNavigationHandlers,
  resetSessionNavigationState,
} from '../../src/services/auth/session-events'
import { advanceAuthEpoch, currentAuthEpoch, resetAuthEpochForTests } from '../../src/services/auth/request-epoch'

describe('session navigation events', () => {
  afterEach(() => {
    resetSessionNavigationState()
    resetAuthEpochForTests()
  })

  it('deduplicates concurrent unauthorized notifications', async () => {
    const onUnauthorized = vi.fn(async () => { await Promise.resolve() })
    registerSessionNavigationHandlers({ onUnauthorized, onForbidden: vi.fn() })

    await Promise.all([notifyUnauthorized(), notifyUnauthorized(), notifyUnauthorized()])
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('handles forbidden separately and swallows navigation failures', async () => {
    const onForbidden = vi.fn(() => { throw new Error('navigation failed') })
    registerSessionNavigationHandlers({ onUnauthorized: vi.fn(), onForbidden })

    await expect(notifyForbidden()).resolves.toBeUndefined()
    expect(onForbidden).toHaveBeenCalledTimes(1)
  })

  it('ignores navigation events from a superseded authentication epoch', async () => {
    const onUnauthorized = vi.fn()
    registerSessionNavigationHandlers({ onUnauthorized, onForbidden: vi.fn() })
    const staleEpoch = currentAuthEpoch()
    advanceAuthEpoch()

    await notifyUnauthorized(staleEpoch)
    expect(onUnauthorized).not.toHaveBeenCalled()

    await notifyUnauthorized(currentAuthEpoch())
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('lets a queued 401 navigation take priority over an in-flight 403', async () => {
    const events: string[] = []
    registerSessionNavigationHandlers({
      onUnauthorized: vi.fn(async () => { events.push('401') }),
      onForbidden: vi.fn(async () => {
        events.push('403')
        await Promise.resolve()
      }),
    })

    const forbidden = notifyForbidden()
    const unauthorized = notifyUnauthorized()
    await Promise.all([forbidden, unauthorized])
    expect(events).toEqual(['403', '401'])
  })

  it('rechecks queued event epochs before invoking navigation handlers', async () => {
    let releaseForbidden!: () => void
    const forbiddenGate = new Promise<void>((resolve) => { releaseForbidden = resolve })
    const onUnauthorized = vi.fn()
    const onForbidden = vi.fn(async () => forbiddenGate)
    registerSessionNavigationHandlers({ onUnauthorized, onForbidden })

    const oldEpoch = currentAuthEpoch()
    const forbidden = notifyForbidden(oldEpoch)
    await Promise.resolve()
    const unauthorized = notifyUnauthorized(oldEpoch)

    advanceAuthEpoch()
    releaseForbidden()
    await Promise.all([forbidden, unauthorized])
    expect(onUnauthorized).not.toHaveBeenCalled()

    await notifyUnauthorized(currentAuthEpoch())
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})
