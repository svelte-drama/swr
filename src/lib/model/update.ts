import type { Broadcaster } from '$lib/broadcaster/types.js'
import type { Cache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'

type UpdateParams = {
  broadcaster: Broadcaster
  cache: Cache
  key: string
  request_pool: RequestPool
}
export async function update<T>(
  { broadcaster, cache, key, request_pool }: UpdateParams,
  data: T
): Promise<T> {
  return request_pool.append(key, async () => {
    const entry = await cache.set(key, data)
    broadcaster.dispatch(key, entry)
    return data
  })
}
