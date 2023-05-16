import { Broadcaster } from '$lib/broadcaster.js'
import type { Broadcaster as BroadcasterType } from '$lib/broadcaster/types.js'
import { IndexedDBCache } from '$lib/cache/indexeddb-cache.js'
import type { Cache } from '$lib/cache/types.js'
import { RequestPool } from '$lib/request-pool.js'
import type {
  ModelVersion,
  Partition,
} from '$lib/types.js'
import { getOrSet } from '$lib/util/get-or-set.js'

type Interals = {
  broadcaster: BroadcasterType
  cache: Cache
  request_pool: RequestPool
}
const internals_cache = new Map<Partition, Map<ModelVersion, Interals>>()

export function createInternals(partition: Partition, version: ModelVersion) {
  const partition_internals = getPartitionCache(partition)
  return getOrSet<ModelVersion, Interals>(
    partition_internals,
    version,
    () => {
      const broadcaster = Broadcaster(partition, version)
      const cache = IndexedDBCache({
        broadcaster,
        partition,
        version,
      })
      return {
        broadcaster,
        cache,
        request_pool: RequestPool(partition, version),
      }
    }
  )
}

export async function clearPartitionCache(partition: Partition) {
  const partition_internals = getPartitionCache(partition)
  for (const internals of partition_internals.values()) {
    await internals.cache.clear?.()
  }
}

function getPartitionCache(partition: Partition) {
  return getOrSet<Partition, Map<ModelVersion, Interals>>(
    internals_cache,
    partition,
    () => new Map()
  )
}
