import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { Cache, CacheEntry } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

const APP_START_TIME = Date.now()

type FetchParams<T> = {
  broadcaster: Broadcaster
  cache: Cache
  fetcher(): Promise<T>
  key: string
  maxAge: number
  request_pool: RequestPool
}
export async function fetch<T>({
  broadcaster,
  cache,
  fetcher,
  key,
  maxAge,
  request_pool,
}: FetchParams<T>): Promise<T> {
  const entry = await cache.get<T>(key)
  if (isCurrent(entry, maxAge)) {
    return entry.data
  }

  return request_pool.request(key, async () => {
    // Check cache again after achieving lock
    const entry = await cache.get<T>(key)
    if (isCurrent(entry, maxAge)) {
      return entry.data
    }

    // Fetch new data
    try {
      const data = await fetcher()
      const cache_entry = await cache.set(key, data)
      broadcaster.dispatch(key, cache_entry)
      return data
    } catch (e) {
      broadcaster.dispatchError(key, e)
      throw e
    }
  })
}

export function isCurrent<T>(
  object: CacheEntry<T> | undefined,
  maxAge: number
): object is CacheEntry<T> {
  return (
    !!object &&
    object.updated > APP_START_TIME &&
    object.updated + maxAge > Date.now()
  )
}
