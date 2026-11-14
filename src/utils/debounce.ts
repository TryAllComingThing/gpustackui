export interface DebouncedTask {
  schedule: (delayMs: number) => void
  cancel: () => void
  flush: () => void
  readonly pending: boolean
}

export function createDebouncedTask(task: () => void): DebouncedTask {
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel() {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function run() {
    timer = null
    task()
  }

  function schedule(delayMs: number) {
    cancel()
    timer = setTimeout(run, Math.max(0, delayMs))
  }

  function flush() {
    if (timer === null) return
    cancel()
    task()
  }

  return {
    schedule,
    cancel,
    flush,
    get pending() {
      return timer !== null
    },
  }
}
