import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { MemoryCache } from '$lib/cache/types.js'
import type { SuspenseFn } from '$lib/types.js'
import { type Readable, readable } from 'svelte/store'

type LiveParams<T> = {
  broadcaster: Broadcaster
  key: string
  memory: MemoryCache
}
export function live<T>(
  { broadcaster, key, memory }: LiveParams<T>,
  runFetch: () => Promise<unknown>,
  suspend?: SuspenseFn
): Readable<T | undefined> {
  let value = memory.get<T>(key)

  const data = readable<T | undefined>(value?.data, (set) => {
    const unsub = broadcaster.onKey<T>(key, (event) => {
      switch (event.type) {
        case 'clear':
        case 'delete': {
          runFetch()
          break
        }

        case 'data': {
          if (!value || event.data.updated > value.updated) {
            value = event.data
            set(event.data.data)
          }
          break
        }
      }
    })
    window.addEventListener('online', runFetch)
    runFetch()

    return () => {
      window.removeEventListener('online', runFetch)
      unsub()
    }
  })

  const error = readable<Error | undefined>(undefined, (set) => {
    return broadcaster.onKey<T>(key, (event) => {
      switch (event.type) {
        case 'data': {
          set(undefined)
          break
        }

        case 'error': {
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
