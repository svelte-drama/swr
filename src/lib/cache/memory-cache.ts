import type { MemoryCache, CacheEntry } from './types.js'

export function MemoryCache(): MemoryCache {
  const cache = new Map<string, CacheEntry>()

  return {
    clear() {
      cache.clear()
    },
    delete(key) {
      cache.delete(key)
    },
    set(key, entry) {
      cache.set(key, entry)
    },
    get<T>(key: string) {
      return cache.get(key) as CacheEntry<T> | undefined
    },
  }
}
