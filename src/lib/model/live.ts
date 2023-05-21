import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { CacheEntry, MemoryCache } from '$lib/cache/types.js'
import type { SuspenseFn } from '$lib/types.js'
import { type Readable, readable } from 'svelte/store'

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

  const data = readable<T | undefined>(value?.data, (set) => {
    function update(entry: CacheEntry<T>) {
      if (!value || entry.updated > value.updated) {
        value = entry
        set(entry.data)
      }
    }

    runFetch().then(update)
    return broadcaster.onKey<T>(key, event => {
      switch (event.type) {
        case "clear":
        case "delete": {
          runFetch()
          break
        }
        
        case "data": {
          update(event.data)
          break
        }
      }
    })
  })

  const error = readable<Error | undefined>(undefined, (set) => {
    return broadcaster.onKey<T>(key, event => {
      switch (event.type) {
        case "data": {
          set(undefined)
          break
        }

        case "error": {
          set(event.error as Error)
          break
        }
      }
    })
  })

  if (suspend) {
    return suspend<T>(data, error)
  }
  return {
    subscribe: data.subscribe,
  }
}
