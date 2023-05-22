import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { RequestPool } from '$lib/request-pool.js'
import type { Internals } from './internals.js'

type RefreshParams<T> = {
  broadcaster: Broadcaster
  fetcher(): Promise<T>
  key: string
  request_pool: RequestPool
  saveToCache: Internals['saveToCache']
}
export function refresh<T>({
  broadcaster,
  fetcher,
  key,
  request_pool,
  saveToCache,
}: RefreshParams<T>): Promise<T> {
  return request_pool.request(key, async () => {
    try {
      const data = await fetcher()
      await saveToCache(key, data)
      return data
    } catch (e) {
      broadcaster.dispatchError(key, e)
      throw e
    }
  })
}
