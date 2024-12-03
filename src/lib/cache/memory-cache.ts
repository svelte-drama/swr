import { SvelteMap } from 'svelte/reactivity'
import type { MemoryCache, CacheEntry } from './types.js'

export function MemoryCache<T>(): MemoryCache<T> {
  const cache = new SvelteMap<string, CacheEntry<T>>()

  return {
    clear() {
      cache.clear()
    },
    delete(key) {
      cache.delete(key)
    },
    keys() {
      return [...cache.keys()]
    },
    set(key, entry) {
      cache.set(key, entry)
    },
    get(key: string) {
      return cache.get(key)
    },
  }
}
