import type { Broadcaster } from '$lib/broadcaster/types.js'
import type {
  MemoryCache,
  CacheEntry,
  IndexedDBCache,
} from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'
import type { Internals } from './internals.js'

const APP_START_TIME = Date.now()

type FetchParams<T> = {
  db: IndexedDBCache
  broadcaster: Broadcaster
  fetcher(): Promise<T>
  key: string
  maxAge: number
  memory: MemoryCache
  request_pool: RequestPool
  saveToCache: Internals['saveToCache']
}
export async function fetch<T>(params: FetchParams<T>): Promise<CacheEntry<T>> {
  const entry = await fetchFromServer(params)
  const { fetcher, key, memory, request_pool, saveToCache } = params

  // Refresh data in the background if older than this tab
  // This allows data to be refreshed if altered on a different device via Ctrl + R
  if (entry.updated < APP_START_TIME) {
    request_pool.request(key, async () => {
      // Check cache again after achieving lock
      const entry = memory.get<T>(key)
      if (!entry || entry.updated < APP_START_TIME) {
        const data = await fetcher()
        await saveToCache(key, data)
      }
    })
  }

  return entry
}

export async function fetchFromServer<T>({
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

  const from_db = await db.get<T>(key)
  if (isCurrent(from_db, maxAge)) {
    broadcaster.dispatch(key, from_db)
    return from_db
  }

  return request_pool.request(key, async () => {
    // Check cache again after achieving lock
    const entry = memory.get<T>(key)
    if (isCurrent(entry, maxAge)) {
      return entry
    }

    // Fetch new data
    try {
      const data = await fetcher()
      return saveToCache(key, data)
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
