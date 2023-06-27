import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { LockFn } from '$lib/lock.js'
import { getLastRefresh } from '$lib/refresh.js'
import type { RequestPool } from '$lib/request-pool.js'

type FetchParams<T> = {
  cache: SWRCache
  fetcher(): Promise<T>
  key: string
  lock: LockFn
  maxAge: number
  request_pool: RequestPool
}

export async function fetch<T>({
  cache,
  fetcher,
  key,
  lock,
  maxAge,
  request_pool,
}: FetchParams<T>): Promise<CacheEntry<T>> {
  return request_pool.request<T>(key, async () => {
    const entry = await lock(key, false, () => {
      return fromCache<T>({ cache, key, maxAge })
    })

    if (entry) return entry

    return lock(key, true, async () => {
      // Check cache again after achieving lock
      const entry = cache.memory.get<T>(key)
      if (isCurrent(entry, maxAge)) {
        return entry
      }

      return fromServer({ cache, fetcher, key })
    })
  })
}

export function isCurrent<T>(
  object: CacheEntry<T> | undefined,
  maxAge: number
): object is CacheEntry<T> {
  return (
    !!object &&
    object.updated + maxAge >= Date.now() &&
    object.updated >= getLastRefresh()
  )
}

async function fromCache<T>({
  cache,
  key,
  maxAge,
}: {
  cache: SWRCache
  key: string
  maxAge: number
}) {
  const from_memory = cache.memory.get<T>(key)
  if (isCurrent(from_memory, maxAge)) {
    return from_memory
  }
  if (from_memory) {
    // Cache in memory is up to date, data is just stale
    return
  }

  const from_db = await cache.db.get<T>(key)
  if (!from_db) return
  cache.memory.set(key, from_db)
  cache.stores.set(key, from_db)

  if (isCurrent(from_db, maxAge)) {
    return from_db
  }
}

async function fromServer<T>({
  cache,
  fetcher,
  key,
}: {
  cache: SWRCache
  fetcher(): Promise<T>
  key: string
}) {
  // Fetch new data
  try {
    const data = await fetcher()
    return cache.set(key, data)
  } catch (e) {
    console.error(e)
    cache.stores.setError(key, e)
    const entry = await cache.db.get<T>(key)
    if (entry) {
      return entry
    } else {
      throw e
    }
  }
}
