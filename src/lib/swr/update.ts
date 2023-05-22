import type { RequestPool } from '$lib/request-pool.js'
import type { Internals } from './internals.js'

type UpdateParams = {
  key: string
  request_pool: RequestPool
  saveToCache: Internals['saveToCache']
}
export async function update<T>(
  { key, request_pool, saveToCache }: UpdateParams,
  data: T
): Promise<T> {
  return request_pool.append(key, async () => {
    await saveToCache(key, data)
    return data
  })
}
