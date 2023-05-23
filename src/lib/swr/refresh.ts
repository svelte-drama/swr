import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

type RefreshParams<T> = {
  cache: SWRCache
  fetcher(): Promise<T>
  key: string
  request_pool: RequestPool
}
export function refresh<T>({
  cache,
  fetcher,
  key,
  request_pool,
}: RefreshParams<T>): Promise<CacheEntry<T>> {
  return request_pool.request<T>(key, async () => {
    try {
      const data = await fetcher()
      return cache.set(key, data)
    } catch (e) {
      cache.stores.setError(key, e)
      throw e
    }
  })
}
