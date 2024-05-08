import { writable, type WritableSignalStore } from '@svelte-drama/signal-store'
import { getOrSet } from '$lib/util/get-or-set.js'
import type { MemoryCache, StoreCache } from './types.js'

type Store<T = any> = {
  data: WritableSignalStore<T | undefined>
  error: WritableSignalStore<Error | undefined>
}

export function StoreCache(memory: MemoryCache): StoreCache {
  const cache = new Map<string, Store>()

  function createStore<T>(key: string, runFetch: () => Promise<unknown>) {
    const entry = memory.get<T>(key)
    const store: Store<T> = {
      data: writable(entry?.data, () => {
        runFetch()
        window.addEventListener('online', runFetch)
        return () => {
          window.removeEventListener('online', runFetch)
        }
      }),
      error: writable(undefined),
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
    get(key, runFetch) {
      return getOrSet(cache, key, () => {
        return createStore(key, runFetch)
      })
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
