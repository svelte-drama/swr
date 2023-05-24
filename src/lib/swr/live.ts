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
  suspend?: SuspenseFn
): Readable<T | undefined> {
  const value = cache.stores.get<T>(key)
  const observer = readable(undefined, (set) => {
    window.addEventListener('online', runFetch)
    runFetch()

    return () => {
      window.removeEventListener('online', runFetch)
    }
  })

  const data = derived([value, observer], ([{ data }]) => {
    if (data === undefined) runFetch()
    return data
  })
  const error = derived([value], ([{ error }]) => error as Error | undefined)

  if (suspend) {
    return suspend<T>(data, error)
  }
  return data
}
