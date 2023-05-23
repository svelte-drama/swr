import type { Broadcaster } from '$lib/broadcaster/types.js'
import type {
  MemoryCache,
  CacheEntry,
  IndexedDBCache,
} from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

const APP_START_TIME = Date.now()

type FetchParams<T> = {
  db: IndexedDBCache
  broadcaster: Broadcaster
  fetcher(): Promise<T>
  key: string
  maxAge: number
  memory: MemoryCache
  request_pool: RequestPool
  saveToCache: (data: T) => Promise<CacheEntry<T>>
}
export async function fetch<T>({
  db,
  broadcaster,
  fetcher,
  key,
  maxAge,
  memory,
  request_pool,
  saveToCache,
}: FetchParams<T>): Promise<CacheEntry<T>> {
  const from_memory = memory.get<T>(key)
  if (isCurrent(from_memory, maxAge)) {
    return from_memory
  }

  if (!from_memory) {
    const from_db = await db.get<T>(key)
    if (isCurrent(from_db, maxAge)) {
      memory.set(key, from_db)

      // Trust but verify any information set before the window was opened
      // This ensures Ctrl + R will refresh data
      request_pool.request<T>(key, async () => {
        // Check cache again after achieving lock
        const entry = memory.get<T>(key)
        if (entry && entry.updated >= APP_START_TIME) {
          return entry
        }
        const data = await fetcher()
        return saveToCache(data)
      })

      return from_db
    }
  }

  return request_pool.request<T>(key, async () => {
    // Check cache again after achieving lock
    const entry = memory.get<T>(key)
    if (isCurrent(entry, maxAge)) {
      return entry
    }

    // Fetch new data
    try {
      const data = await fetcher()
      return saveToCache(data)
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
  return !!object && object.updated + maxAge > Date.now()
}
