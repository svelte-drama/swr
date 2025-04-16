import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelName } from '$lib/types.js'

export type LockFn = <T>(
  key: string,
  exclusive: boolean,
  fn: () => Promise<T>,
) => Promise<T>

export const Lock = navigator.locks ? LockPolyfill : NavigatorLock

function NavigatorLock(model_name: ModelName): LockFn {
  return async function acquireLock<T>(
    key: string,
    exclusive: boolean,
    fn: () => Promise<T>,
  ) {
    const lock = `${SWR_VERSION}${SEPARATOR}${model_name}${SEPARATOR}${key}`
    return navigator.locks.request(
      lock,
      { mode: exclusive ? 'exclusive' : 'shared' },
      fn,
    )
  }
}

const queue = new Map<string, Promise<any>>()

function LockPolyfill(model_name: ModelName): LockFn {
  return async function acquireLock<T>(
    key: string,
    exclusive: boolean,
    fn: () => Promise<T>,
  ) {
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
