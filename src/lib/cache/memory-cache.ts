import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { MemoryCache, CacheEntry } from './types.js'

export function MemoryCache(broadcaster: Broadcaster): MemoryCache {
  const cache = new Map<string, CacheEntry>()

  broadcaster.onAllData((message, foreign) => {
    if (foreign) {
      if (message.type === 'data') {
        cache.set(message.key, message.data)
      } else if (message.type === 'delete') {
        cache.delete(message.key)
      }
    }
  })

  return {
    clear() {
      cache.clear()
    },
    delete(key) {
      cache.delete(key)
    },
    get<T>(key: string) {
      return cache.get(key) as CacheEntry<T> | undefined
    },
    set(key, entry) {
      cache.set(key, entry)
    },
  }
}
