import { isEventSameOrigin } from '$lib/broadcaster.js'
import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { ModelName } from '$lib/types.js'
import { createCacheEntry } from './create-cache-entry.js'
import { IndexedDBCache } from './indexeddb-cache.js'
import { MemoryCache } from './memory-cache.js'
import type { SWRCache } from './types.js'

export function SWRCache<T>(
  model_name: ModelName,
  broadcaster: Broadcaster,
): SWRCache<T> {
  const db = IndexedDBCache<T>(model_name)
  const memory = MemoryCache<T>()

  broadcaster.on((event) => {
    if (isEventSameOrigin(event)) {
      // Clearing all caches is triggered via event
      // All other events are duplicates of actions performed directly on this model
      if (event.type === 'clear' && !event.model) {
        memory.clear()
      }
      return
    }

    switch (event.type) {
      case 'clear': {
        memory.clear()
        break
      }

      case 'data': {
        const entry = memory.get(event.key)
        if (entry && entry.updated < event.data.updated) {
          memory.set(event.key, event.data)
        }
        break
      }

      case 'delete': {
        memory.delete(event.key)
        break
      }
    }
  })

  return {
    db,
    memory,
    async clear() {
      memory.clear()
      await db.clear()
      broadcaster.dispatchClear()
    },
    async delete(key: string) {
      memory.delete(key)
      await db.delete(key)
      broadcaster.dispatchDelete(key)
    },
    async set(key: string, data: T) {
      const snapshot = $state.snapshot(data) as T
      const entry = createCacheEntry<T>(snapshot)

      await db.set(key, entry)
      memory.set(key, entry)
      broadcaster.dispatch(key, entry)

      return entry
    },
  }
}
