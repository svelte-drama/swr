import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { Cache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

type RefreshParams<T> = {
  broadcaster: Broadcaster
  cache: Cache
  fetcher(): Promise<T>
  key: string
  request_pool: RequestPool
}
export function refresh<T>({
  broadcaster,
  cache,
  fetcher,
  key,
  request_pool,
}: RefreshParams<T>): Promise<T> {
  return request_pool.request(key, async () => {
    try {
      const data = await fetcher()
      const entry = await cache.set(key, data)
      broadcaster.dispatch(key, entry)
      return data
    } catch (e) {
      broadcaster.dispatchError(key, e)
      throw e
    }
  })
}
