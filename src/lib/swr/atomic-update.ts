import type {
  CacheEntry,
  IndexedDBCache,
  MemoryCache,
} from '$lib/cache/types.js'
import type { RequestPool } from '$lib/request-pool.js'
import type { MaybePromise } from '$lib/types.js'

type AtomicUpdateParams<T> = {
  db: IndexedDBCache
  fetcher(): Promise<T>
  key: string
  maxAge: number
  memory: MemoryCache
  request_pool: RequestPool
  saveToCache: (data: T) => Promise<CacheEntry<T>>
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
): Promise<CacheEntry<T>> {
  return request_pool.append<T>(key, async () => {
    const initial =
      memory.get<T>(key)?.data ??
      (await db.get<T>(key))?.data ??
      (await fetcher())
    const data = await fn(initial)
    return saveToCache(data)
  })
}
