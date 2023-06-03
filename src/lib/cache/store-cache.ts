import { writable, type Readable, type Writable } from 'svelte/store'
import { getOrSet } from '$lib/util/get-or-set.js'
import type { IndexedDBCache, MemoryCache, StoreCache } from './types.js'

type Store<T = unknown> = {
  data: T | undefined
  error?: unknown
}

export function StoreCache(
  memory: MemoryCache,
  db: IndexedDBCache
): StoreCache {
  const cache = new Map<string, Writable<Store>>()

  function createStore<T>(key: string) {
    const entry = memory.get<T>(key)
    const store = writable<Store<T>>({ data: entry?.data })
    if (!entry) {
      db.get<T>(key).then((db_entry) => {
        if (!db_entry) return

        const entry = memory.get<T>(key)
        if (!entry || db_entry.updated > entry.updated) {
          memory.set(key, db_entry)
          store.set({ data: db_entry.data })
        }
      })
    }
    return store
  }

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
      return getOrSet(cache, key, () => createStore<T>(key)) as Readable<
        Store<T>
      >
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
