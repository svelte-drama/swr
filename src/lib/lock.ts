import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelName } from '$lib/types.js'

export type LockFn = <T>(
  key: string,
  exclusive: boolean,
  fn: () => Promise<T>
) => Promise<T>

export function Lock(model_name: ModelName): LockFn {
  return function acquireLock<T>(
    key: string,
    exclusive: boolean,
    fn: () => Promise<T>
  ) {
    return new Promise<T>((resolve) => {
      navigator.locks.request(
        `${SWR_VERSION}${SEPARATOR}${model_name}${SEPARATOR}${key}`,
        { mode: exclusive ? 'exclusive' : 'shared' },
        async () => {
          const result = await fn()
          resolve(result)
        }
      )
    })
  }
}
