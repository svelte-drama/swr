import type { CacheEntry } from './types.js'

export function createCacheEntry<T>(data: T): CacheEntry<T> {
  return {
    data,
    updated: Date.now(),
  }
}
