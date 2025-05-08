import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelName } from '$lib/types.js'

export type LockFn = <T>(key: string, fn: () => Promise<T>) => Promise<T>

export const Lock =
  typeof navigator.locks === 'undefined' ? LockPolyfill : NavigatorLock

function NavigatorLock(model_name: ModelName): LockFn {
  return async function acquireLock<T>(key: string, fn: () => Promise<T>) {
    // Capture the current call stack for future errors
    const stack = new Error('SWR: Unable to perform operation')

    const lock = `${SWR_VERSION}${SEPARATOR}${model_name}${SEPARATOR}${key}`
    return navigator.locks.request(lock, { mode: 'exclusive' }, async () => {
      try {
        return fn()
      } catch (e) {
        stack.cause = e
        throw stack
      }
    })
  }
}

const queue = new Map<string, Promise<any>>()

function LockPolyfill(model_name: ModelName): LockFn {
  return async function acquireLock<T>(key: string, fn: () => Promise<T>) {
    const lock = `${SWR_VERSION}${SEPARATOR}${model_name}${SEPARATOR}${key}`

    const previous = queue.get(lock) ?? Promise.resolve()
    const next = previous.then(fn, fn).finally(() => {
      if (queue.get(lock) === next) {
        queue.delete(lock)
      }
    })
    queue.set(lock, next)

    return next
  }
}
