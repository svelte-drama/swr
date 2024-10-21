import type { CacheEntry, SWRCache } from '$lib/cache/types.js'
import type { LockFn } from '$lib/lock.js'
import type { RequestPool } from '$lib/request-pool.js'
import { fromServer } from './fetch.js'

type RefreshParams<T> = {
  cache: SWRCache<T>
  fetcher(): Promise<T>
  key: string
  lock: LockFn
  request_pool: RequestPool<T>
}
export function refresh<T>({
  cache,
  fetcher,
  key,
  lock,
  request_pool,
}: RefreshParams<T>): Promise<CacheEntry<T>> {
  return request_pool.request(key, async () => {
    return lock(key, true, async () => {
      return fromServer({ cache, fetcher, key })
    })
  })
}
