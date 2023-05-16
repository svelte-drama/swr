import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { Cache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'
import type { CreateSuspenseFn } from '$lib/types.js'
import { isCurrent } from './fetch.js'
import { refresh } from './refresh.js'
import { writable, type Readable } from 'svelte/store'

type LiveParams<T> = {
  broadcaster: Broadcaster
  cache: Cache
  fetcher(): Promise<T>
  key: string
  maxAge: number
  request_pool: RequestPool
  suspense?: CreateSuspenseFn
}
export function live<T>({
  broadcaster,
  cache,
  fetcher,
  key,
  maxAge,
  request_pool,
  suspense,
}: LiveParams<T>): Readable<T | undefined> {
  const data = writable<T | undefined>(undefined, (set) => {
    cache.get<T>(key).then((entry) => {
      set(entry?.data)
      if (!isCurrent(entry, maxAge)) {
        refresh({
          broadcaster,
          cache,
          fetcher,
          key,
          request_pool,
        })
      }
    })
    return broadcaster.onData<T>(key, (object) => {
      set(object.data)
    })
  })
  const error = writable<Error | undefined>(undefined, (set) => {
    const unsub_data = broadcaster.onData(key, () => {
      set(undefined)
    })
    const unsub_error = broadcaster.onError(key, (e) => {
      set(e as Error | undefined)
    })
    return () => {
      unsub_data()
      unsub_error()
    }
  })

  if (suspense) {
    const suspend = suspense()
    return suspend<T>(data, error)
  }
  return {
    subscribe: data.subscribe,
  }
}
