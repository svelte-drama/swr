import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { MemoryCache, CacheEntry } from './types.js'

export function MemoryCache(broadcaster: Broadcaster): MemoryCache {
  const cache = new Map<string, CacheEntry>()

  broadcaster.on((event) => {
    switch (event.type) {
      case "clear": {
        cache.clear()
        break
      }

      case "data": {
        cache.set(event.key, event.data)
        break
      }

      case "delete": {
        cache.delete(event.key)
        break
      }
    }
  })

  return {
    get<T>(key: string) {
      return cache.get(key) as CacheEntry<T> | undefined
    },
  }
}
