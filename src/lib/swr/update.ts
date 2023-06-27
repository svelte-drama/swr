import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { LockFn } from '$lib/lock.js'

type UpdateParams<T> = {
  cache: SWRCache
  key: string
  lock: LockFn
}
export function update<T>(
  { cache, key, lock }: UpdateParams<T>,
  data: T
): Promise<CacheEntry<T>> {
  return lock(key, true, () => {
    return cache.set(key, data)
  })
}
