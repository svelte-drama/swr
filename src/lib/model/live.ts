import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { Cache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'
import type { SuspenseFn } from '$lib/types.js'
import { fetch } from './fetch.js'
import { writable, type Readable } from 'svelte/store'

type LiveParams<T> = {
  broadcaster: Broadcaster
  cache: Cache
  fetcher(): Promise<T>
  key: string
  maxAge: number
  request_pool: RequestPool
}
export function live<T>(
  { broadcaster, cache, fetcher, key, maxAge, request_pool }: LiveParams<T>,
  suspend?: SuspenseFn
): Readable<T | undefined> {
  const runFetch = () => fetch({
    broadcaster,
    cache,
    fetcher,
    key,
    maxAge,
    request_pool,
  })
  const data = writable<T | undefined>(undefined, (set) => {
    runFetch().then(set)
    const unsub_data = broadcaster.onData<T>(key, (object) => {
      set(object.data)
    })
    const unsub_delete = broadcaster.onDelete(key, () => {
      runFetch()
    })
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
