import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelName } from '$lib/types.js'

export type LockFn = <T>(
  key: string,
  exclusive: boolean,
  fn: () => Promise<T>,
) => Promise<T>

export function Lock(model_name: ModelName): LockFn {
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
