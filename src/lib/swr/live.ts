import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { SWRCache } from '$lib/cache/types.js'
import type { SuspenseFn } from '$lib/types.js'
import { type Readable, readable, derived } from 'svelte/store'

type LiveParams = {
  broadcaster: Broadcaster
  cache: SWRCache
  key: string
}
export function live<T>(
  { cache, key }: LiveParams,
  runFetch: () => Promise<unknown>,
  suspend?: SuspenseFn,
): Readable<T | undefined> {
  const { data, error } = cache.stores.get<T>(key)
  const observer = readable(undefined, () => {
    window.addEventListener('online', runFetch)
    runFetch()

    return () => {
      window.removeEventListener('online', runFetch)
    }
  })

  const store = derived([data, observer], ([data]) => {
    return data
  })

  return suspend ? suspend<T>(store, error) : store
}
