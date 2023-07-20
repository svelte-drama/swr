import { writable, type Readable, type Writable } from 'svelte/store'
import { getOrSet } from '$lib/util/get-or-set.js'
import type { IndexedDBCache, MemoryCache, StoreCache } from './types.js'

type Store<T = unknown> = {
  data: Writable<T | undefined>
  error: Writable<Error | undefined>
}

export function StoreCache(
  memory: MemoryCache,
  db: IndexedDBCache,
): StoreCache {
  const cache = new Map<string, Store>()

  function createStore<T>(key: string) {
    const entry = memory.get<T>(key)
    const store: Store<T> = {
      data: writable(entry?.data),
      error: writable(undefined),
    }
    if (!entry) {
      db.get<T>(key).then((db_entry) => {
        if (!db_entry) return

        const entry = memory.get<T>(key)
        if (!entry || db_entry.updated > entry.updated) {
          memory.set(key, db_entry)
          store.data.set(db_entry.data)
        }
      })
    }
    return store
  }

  function deleteKey(key: string) {
    const record = cache.get(key)
    record?.data.set(undefined)
    record?.error.set(undefined)
  }

  return {
    clear() {
      for (const key of cache.keys()) {
        deleteKey(key)
      }
    },
    delete: deleteKey,
    get<T>(key: string) {
      return getOrSet(cache, key, () => createStore<T>(key)) as Store<T>
    },
    set(key, entry) {
      const record = cache.get(key)
      record?.data.set(entry.data)
      record?.error.set(undefined)
    },
    setError(key, error) {
      const record = cache.get(key)
      record?.error.set(error)
    },
  }
}
