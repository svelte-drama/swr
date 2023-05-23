import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

type UpdateParams<T> = {
  cache: SWRCache
  key: string
  request_pool: RequestPool
}
export async function update<T>(
  { cache, key, request_pool }: UpdateParams<T>,
  data: T
): Promise<CacheEntry<T>> {
  return request_pool.append<T>(key, async () => {
    return cache.set(key, data)
  })
}
