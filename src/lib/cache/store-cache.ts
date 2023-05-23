import { writable, type Readable, type Writable } from 'svelte/store'
import type { MemoryCache, StoreCache } from './types.js'
import { getOrSet } from '$lib/util/get-or-set.js'

export function StoreCache(memory: MemoryCache): StoreCache {
  const cache = new Map<
    string,
    Writable<{
      data: unknown
      error?: unknown
    }>
  >()

  return {
    clear() {
      for (const key of cache.keys()) {
        const record = cache.get(key)
        record?.set({ data: undefined })
      }
    },
    delete(key) {
      const record = cache.get(key)
      record?.set({ data: undefined })
    },
    get<T>(key: string) {
      return getOrSet(cache, key, () => {
        const entry = memory.get<T>(key)
        return writable({ data: entry?.data })
      }) as Readable<{
        data: T | undefined
        error: unknown
      }>
    },
    set(key, entry) {
      const record = cache.get(key)
      record?.set({ data: entry.data })
    },
    setError(key, error) {
      const record = cache.get(key)
      record?.update(({ data }) => ({
        data,
        error,
      }))
    },
  }
}
