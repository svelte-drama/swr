import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { CacheEntry } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

type RefreshParams<T> = {
  broadcaster: Broadcaster
  fetcher(): Promise<T>
  key: string
  request_pool: RequestPool
  saveToCache: (data: T) => Promise<CacheEntry<T>>
}
export function refresh<T>({
  broadcaster,
  fetcher,
  key,
  request_pool,
  saveToCache,
}: RefreshParams<T>): Promise<CacheEntry<T>> {
  return request_pool.request<T>(key, async () => {
    try {
      const data = await fetcher()
      return saveToCache(data)
    } catch (e) {
      broadcaster.dispatchError(key, e)
      throw e
    }
  })
}
