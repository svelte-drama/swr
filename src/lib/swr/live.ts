import { readable, type ReadableSignalStore } from '@svelte-drama/signal-store'
import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { SWRCache } from '$lib/cache/types.js'
import type { SuspenseFn } from '$lib/types.js'

type LiveParams = {
  broadcaster: Broadcaster
  cache: SWRCache
  key: string
}
export function live<T>(
  { cache, key }: LiveParams,
  runFetch: () => Promise<unknown>,
  suspend?: SuspenseFn,
): ReadableSignalStore<T | undefined> {
  const { data, error } = cache.stores.get<T>(key, runFetch)

  if (!suspend) return data
  const suspended = suspend<T>(data, error)
  return readable<T | undefined>(undefined, (set) => {
    return suspended.subscribe(set)
  })
}
