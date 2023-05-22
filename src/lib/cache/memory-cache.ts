import { isEventSameOrigin } from '$lib/broadcaster.js'
import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { MemoryCache, CacheEntry } from './types.js'

export function MemoryCache(broadcaster: Broadcaster): MemoryCache {
  const cache = new Map<string, CacheEntry>()

  broadcaster.on((event) => {
    if (isEventSameOrigin(event)) {
      // Clearing all caches is triggered via event
      // All other events are duplicates of actions performed directly on this model
      if (event.type === 'clear' && !event.model) {
        cache.clear()
      }
      return
    }

    switch (event.type) {
      case 'clear': {
        cache.clear()
        break
      }

      case 'data': {
        const entry = cache.get(event.key)
        if (!entry || entry.updated < event.data.updated) {
          cache.set(event.key, event.data)
        }
        break
      }

      case 'delete': {
        cache.delete(event.key)
        break
      }
    }
  })

  return {
    clear() {
      cache.clear()
      broadcaster.dispatchClear()
    },
    delete(key) {
      cache.delete(key)
      broadcaster.dispatchDelete(key)
    },
    set(key, entry) {
      cache.set(key, entry)
      broadcaster.dispatch(key, entry)
    },
    get<T>(key: string) {
      return cache.get(key) as CacheEntry<T> | undefined
    },
  }
}
