import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { CacheEntry, MemoryCache } from '$lib/cache/types.js'
import type { SuspenseFn } from '$lib/types.js'
import { writable, type Readable } from 'svelte/store'

type LiveParams<T> = {
  broadcaster: Broadcaster
  key: string
  memory: MemoryCache
}
export function live<T>(
  { broadcaster, key, memory }: LiveParams<T>,
  runFetch: () => Promise<CacheEntry<T>>,
  suspend?: SuspenseFn
): Readable<T | undefined> {
  let value = memory.get<T>(key)
  const data = writable<T | undefined>(value?.data, (set) => {
    function update(entry: CacheEntry<T>) {
      if (!value || entry.updated > value.updated) {
        value = entry
        set(entry.data)
      }
    }

    runFetch().then(update)
    const unsub_data = broadcaster.onData<T>(key, update)
    const unsub_delete = broadcaster.onDelete(key, runFetch)

    return () => {
      unsub_data()
      unsub_delete()
    }
  })
  const error = writable<Error | undefined>(undefined, (set) => {
    const unsub_data = broadcaster.onData(key, () => {
      set(undefined)
    })
    const unsub_delete = broadcaster.onDelete(key, () => {
      set(undefined)
    })
    const unsub_error = broadcaster.onError(key, (e) => {
      set(e as Error | undefined)
    })
    return () => {
      unsub_data()
      unsub_delete()
      unsub_error()
    }
  })

  if (suspend) {
    return suspend<T>(data, error)
  }
  return {
    subscribe: data.subscribe,
  }
}
