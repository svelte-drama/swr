import type { CacheEntry } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

type UpdateParams<T> = {
  key: string
  request_pool: RequestPool
  saveToCache: (data: T) => Promise<CacheEntry<T>>
}
export async function update<T>(
  { key, request_pool, saveToCache }: UpdateParams<T>,
  data: T
): Promise<CacheEntry<T>> {
  return request_pool.append<T>(key, async () => {
    return saveToCache(data)
  })
}
