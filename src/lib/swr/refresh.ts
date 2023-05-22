import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { RequestPool } from '$lib/request-pool.js'

type RefreshParams<T> = {
  broadcaster: Broadcaster
  fetcher(): Promise<T>
  key: string
  request_pool: RequestPool
  saveToCache: (data: T) => Promise<unknown>
}
export function refresh<T>({
  broadcaster,
  fetcher,
  key,
  request_pool,
  saveToCache,
}: RefreshParams<T>): Promise<T> {
  return request_pool.request<T>(key, async () => {
    try {
      const data = await fetcher()
      await saveToCache(data)
      return data
    } catch (e) {
      broadcaster.dispatchError(key, e)
      throw e
    }
  })
}
