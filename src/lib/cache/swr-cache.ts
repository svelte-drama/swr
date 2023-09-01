import { isEventSameOrigin } from '$lib/broadcaster.js'
import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { ModelName } from '$lib/types.js'
import { createCacheEntry } from './create-cache-entry.js'
import { IndexedDBCache } from './indexeddb-cache.js'
import { MemoryCache } from './memory-cache.js'
import { StoreCache } from './store-cache.js'
import type { SWRCache } from './types.js'

export function SWRCache(
  model_name: ModelName,
  broadcaster: Broadcaster,
): SWRCache {
  const db = IndexedDBCache(model_name)
  const memory = MemoryCache()
  const stores = StoreCache(memory, db)

  broadcaster.on((event) => {
    if (isEventSameOrigin(event)) {
      // Clearing all caches is triggered via event
      // All other events are duplicates of actions performed directly on this model
      if (event.type === 'clear' && !event.model) {
        memory.clear()
        stores.clear()
      }
      return
    }

    switch (event.type) {
      case 'clear': {
        memory.clear()
        stores.clear()
        break
      }

      case 'data': {
        const entry = memory.get(event.key)
        if (!entry || entry.updated < event.data.updated) {
          memory.set(event.key, event.data)
          stores.set(event.key, event.data)
        }
        break
      }

      case 'delete': {
        memory.delete(event.key)
        stores.delete(event.key)
        break
      }
    }
  })

  return {
    db,
    memory,
    stores,
    clear() {
      db.clear()
      memory.clear()
      stores.clear()
      broadcaster.dispatchClear()
    },
    delete(key: string) {
      db.delete(key)
      memory.delete(key)
      stores.delete(key)
      broadcaster.dispatchDelete(key)
    },
    async set<T>(key: string, data: T) {
      const entry = createCacheEntry<T>(data)
      await db.set(key, entry)

      const from_memory = memory.get(key)
      if (!from_memory || data !== from_memory.data) {
        stores.set(key, entry)
      }

      memory.set(key, entry)
      broadcaster.dispatch(key, entry)
      return entry
    },
  }
}
