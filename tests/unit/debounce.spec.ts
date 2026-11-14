import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedTask } from '../../src/utils/debounce'

describe('debounced task', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('coalesces rapid scheduling into one trailing task', () => {
    const task = vi.fn()
    const debounced = createDebouncedTask(task)

    debounced.schedule(300)
    debounced.schedule(300)
    debounced.schedule(300)
    expect(task).not.toHaveBeenCalled()
    expect(debounced.pending).toBe(true)

    vi.advanceTimersByTime(299)
    expect(task).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(task).toHaveBeenCalledTimes(1)
    expect(debounced.pending).toBe(false)
  })

  it('supports cancel and flush without late duplicate execution', () => {
    const task = vi.fn()
    const debounced = createDebouncedTask(task)

    debounced.schedule(100)
    debounced.cancel()
    vi.advanceTimersByTime(100)
    expect(task).not.toHaveBeenCalled()

    debounced.schedule(100)
    debounced.flush()
    expect(task).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    expect(task).toHaveBeenCalledTimes(1)
  })
})
