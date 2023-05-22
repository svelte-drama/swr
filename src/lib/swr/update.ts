import type { RequestPool } from '$lib/request-pool.js'

type UpdateParams<T> = {
  key: string
  request_pool: RequestPool
  saveToCache: (data: T) => Promise<unknown>
}
export async function update<T>(
  { key, request_pool, saveToCache }: UpdateParams<T>,
  data: T
): Promise<T> {
  return request_pool.append<T>(key, async () => {
    await saveToCache(data)
    return data
  })
}
