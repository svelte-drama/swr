import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { Cache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'
import type { MaybePromise } from '$lib/types.js'

type AtomicUpdateParams<T> = {
  broadcaster: Broadcaster
  cache: Cache
  fetcher(): Promise<T>
  key: string
  maxAge: number
  request_pool: RequestPool
}
export async function atomicUpdate<T>(
  { broadcaster, cache, key, fetcher, request_pool }: AtomicUpdateParams<T>,
  fn: (data: T) => MaybePromise<T>
): Promise<T> {
  async function fromCache() {
    const from_cache = await cache.get<T>(key)
    if (from_cache) return from_cache.data
  }
  async function fromPool() {
    return request_pool.request<T>(key, fetcher)
  }

  const from_cache = await fromCache()
  const data = from_cache ?? (await fromPool())
  return request_pool.append(key, async () => {
    const from_cache = await fromCache()
    const new_data = await fn(from_cache ?? data)
    const entry = await cache.set(key, new_data)
    broadcaster.dispatch(key, entry)
    return new_data
  })
}
