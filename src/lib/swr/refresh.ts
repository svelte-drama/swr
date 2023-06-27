import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { LockFn } from '$lib/lock.js'
import type { RequestPool } from '$lib/request-pool.js'

type RefreshParams<T> = {
  cache: SWRCache
  fetcher(): Promise<T>
  key: string
  lock: LockFn
  request_pool: RequestPool
}
export function refresh<T>({
  cache,
  fetcher,
  key,
  lock,
  request_pool,
}: RefreshParams<T>): Promise<CacheEntry<T>> {
  return request_pool.request<T>(key, async () => {
    return lock(key, true, async () => {
      try {
        const data = await fetcher()
        return cache.set(key, data)
      } catch (e) {
        cache.stores.setError(key, e)
        throw e
      }
    })
  })
}
