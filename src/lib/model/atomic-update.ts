import type { IndexedDBCache, MemoryCache } from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'
import type { MaybePromise } from '$lib/types.js'
import type { Internals } from './internals.js'

type AtomicUpdateParams<T> = {
  db: IndexedDBCache
  fetcher(): Promise<T>
  key: string
  maxAge: number
  memory: MemoryCache
  request_pool: RequestPool
  saveToCache: Internals['saveToCache']
}
export async function atomicUpdate<T>(
  {
    db,
    key,
    fetcher,
    memory,
    request_pool,
    saveToCache,
  }: AtomicUpdateParams<T>,
  fn: (data: T) => MaybePromise<T>
): Promise<T> {
  async function fromCache() {
    const entry = memory.get<T>(key) ?? (await db.get<T>(key))
    return entry?.data
  }
  async function fromPool() {
    return request_pool.request<T>(key, fetcher)
  }

  const from_cache = await fromCache()
  const data = from_cache ?? (await fromPool())
  return request_pool.append(key, async () => {
    // Make sure data hasn't changed while acquiring lock
    const from_cache = await fromCache()
    const new_data = await fn(from_cache ?? data)

    await saveToCache(key, new_data)
    return new_data
  })
}
