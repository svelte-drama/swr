import { createCacheEntry } from '$lib/cache/create-cache-entry.js'
import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { LockFn } from '$lib/lock.js'

type UpdateParams<T> = {
  cache: SWRCache<T>
  key: string
  lock: LockFn
}
export function update<T>(
  { cache, key, lock }: UpdateParams<T>,
  data: T,
): Promise<CacheEntry<T>> {
  const entry = createCacheEntry(data)
  cache.memory.set(key, entry)

  return lock(key, true, () => {
    return cache.set(key, data)
  })
}
