import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

type FetchParams<T> = {
  cache: SWRCache
  fetcher(): Promise<T>
  key: string
  maxAge: number
  request_pool: RequestPool
}

export async function fetch<T>({
  cache,
  fetcher,
  key,
  maxAge,
  request_pool,
}: FetchParams<T>): Promise<CacheEntry<T>> {
  const from_memory = cache.memory.get<T>(key)
  if (isCurrent(from_memory, maxAge)) {
    return from_memory
  }

  if (!from_memory) {
    const from_db = await cache.db.get<T>(key)
    // Cache can be updated while accessing the database cache
    if (isCurrent(from_db, maxAge)) {
      const from_memory = cache.memory.get<T>(key)
      if (!from_memory || from_db.updated > from_memory.updated) {
        cache.memory.set(key, from_db)
        cache.stores.set(key, from_db)
        return from_db
      } else {
        return from_memory
      }
    }
  }

  return request_pool.request<T>(key, async () => {
    // Check cache again after achieving lock
    const entry = cache.memory.get<T>(key)
    if (isCurrent(entry, maxAge)) {
      return entry
    }

    // Fetch new data
    try {
      const data = await fetcher()
      return cache.set(key, data)
    } catch (e) {
      cache.stores.setError(key, e)
      const entry = await cache.db.get<T>(key)
      if (entry) {
        return entry
      } else {
        throw e
      }
    }
  })
}

export function isCurrent<T>(
  object: CacheEntry<T> | undefined,
  maxAge: number
): object is CacheEntry<T> {
  return !!object && object.updated + maxAge >= Date.now()
}
