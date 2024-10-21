import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { LockFn } from '$lib/lock.js'
import type { RequestPool } from '$lib/request-pool.js'
import type { MaybePromise } from '$lib/types.js'

type AtomicUpdateParams<T> = {
  cache: SWRCache<T>
  fetcher(): Promise<T>
  key: string
  lock: LockFn
  maxAge: number
  request_pool: RequestPool<T>
}
export async function atomicUpdate<T>(
  { cache, key, fetcher, lock, request_pool }: AtomicUpdateParams<T>,
  fn: (data: T) => MaybePromise<T>,
): Promise<CacheEntry<T>> {
  return request_pool.append(key, async () => {
    return lock(key, true, async () => {
      const initial =
        cache.memory.get(key)?.data ??
        (await cache.db.get(key))?.data ??
        (await fetcher())
      const data = await fn(initial)
      return cache.set(key, data)
    })
  })
}
