import { Broadcaster } from '$lib/broadcaster.js'
import type { Broadcaster as BroadcasterType } from '$lib/broadcaster/types.js'
import { createCacheEntry } from '$lib/cache/create-cache-entry.js'
import { IndexedDBCache } from '$lib/cache/indexeddb-cache.js'
import { MemoryCache } from '$lib/cache/memory-cache.js'
import type {
  CacheEntry,
  IndexedDBCache as IndexedDBCacheType,
  MemoryCache as MemoryCacheType,
} from '$lib/cache/types.js'
import { RequestPool } from '$lib/request-pool.js'
import type { ModelName } from '$lib/types.js'
import { getOrSet } from '$lib/util/get-or-set.js'

export type Internals = {
  broadcaster: BroadcasterType
  db: IndexedDBCacheType
  memory: MemoryCacheType
  request_pool: RequestPool
  saveToCache<T>(key: string, data: T): Promise<CacheEntry<T>>
}
const internals_cache = new Map<ModelName, Internals>()

export function createInternals(model_name: ModelName) {
  return getOrSet<ModelName, Internals>(internals_cache, model_name, () => {
    const broadcaster = Broadcaster(model_name)
    const db = IndexedDBCache(model_name)
    const memory = MemoryCache(broadcaster)

    return {
      broadcaster,
      db,
      memory,
      request_pool: RequestPool(model_name),
      async saveToCache<T>(key: string, data: T) {
        const cache_entry = createCacheEntry(data)
        await db.set(key, cache_entry)
        broadcaster.dispatch(key, cache_entry)
        return cache_entry
      },
    }
  })
}
