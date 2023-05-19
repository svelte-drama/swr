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
import type { ModelVersion, Partition } from '$lib/types.js'
import { getOrSet } from '$lib/util/get-or-set.js'

export type Internals = {
  broadcaster: BroadcasterType
  db: IndexedDBCacheType
  memory: MemoryCacheType
  request_pool: RequestPool
  saveToCache<T>(key: string, data: T): Promise<CacheEntry<T>>
}
const internals_cache = new Map<Partition, Map<ModelVersion, Internals>>()

export function createInternals(partition: Partition, version: ModelVersion) {
  const partition_internals = getPartitionCache(partition)
  return getOrSet<ModelVersion, Internals>(partition_internals, version, () => {
    const broadcaster = Broadcaster(partition, version)
    const db = IndexedDBCache({
      partition,
      version,
    })
    const memory = MemoryCache(broadcaster)

    return {
      broadcaster,
      db,
      memory,
      request_pool: RequestPool(partition, version),
      async saveToCache<T>(key: string, data: T) {
        const cache_entry = createCacheEntry(data)
        await db.set(key, cache_entry)
        memory.set(key, cache_entry)
        broadcaster.dispatch(key, cache_entry)
        return cache_entry
      },
    }
  })
}

export async function clearMemoryCachePartition(partition: Partition) {
  const partition_internals = getPartitionCache(partition)
  for (const internals of partition_internals.values()) {
    internals.memory.clear?.()
  }
}

function getPartitionCache(partition: Partition) {
  return getOrSet<Partition, Map<ModelVersion, Internals>>(
    internals_cache,
    partition,
    () => new Map()
  )
}
