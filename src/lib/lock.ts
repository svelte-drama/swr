import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelName } from '$lib/types.js'
import { RequestPool } from '$lib/request-pool.js'

export type LockFn = <T>(
  key: string,
  exclusive: boolean,
  fn: () => Promise<T>,
) => Promise<T>

const lock_registery = RequestPool()

export function Lock(model_name: ModelName): LockFn {
  return function acquireLock<T>(
    key: string,
    exclusive: boolean,
    fn: () => Promise<T>,
  ) {
    return new Promise<T>((resolve, reject) => {
      const lock = `${SWR_VERSION}${SEPARATOR}${model_name}${SEPARATOR}${key}`
      const callback = () => fn().then(resolve, reject)

      if (typeof navigator.locks !== 'undefined') {
        navigator.locks.request(
          lock,
          { mode: exclusive ? 'exclusive' : 'shared' },
          callback,
        )
      } else {
        lock_registery.append(lock, callback)
      }
    })
  }
}
