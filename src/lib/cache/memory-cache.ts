import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { Cache, CacheEntry } from './types.js'

export function MemoryCache(broadcaster: Broadcaster): Cache {
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
    async clear() {
      cache.clear()
    },
    async delete(key) {
      cache.delete(key)
    },
    async get<T>(key: string) {
      return cache.get(key) as CacheEntry<T> | undefined
    },
    async set<T>(key: string, data: T) {
      const entry: CacheEntry<T> = {
        data,
        updated: Date.now(),
      }
      cache.set(key, entry)
      return entry
    },
  }
}
