import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

export type CacheObject<T> = {
  data: Writable<T | undefined>
  error: Writable<Error | undefined>
  last_update: number
  request: Writable<Promise<T | void> | undefined>
}
export const cache = new Map<string, CacheObject<unknown>>()

function createCacheItem<T>(key: string) {
  const store: CacheObject<T> = {
    data: writable<T>(),
    error: writable(),
    last_update: 0,
    request: writable(undefined),
  }
  cache.set(key, store)
  return store
}

export function getOrCreate<T>(key: string) {
  return (cache.get(key) as CacheObject<T>) || createCacheItem<T>(key)
}
