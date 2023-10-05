import type { CacheEntry } from '$lib/cache/types.js'

export type RequestPool = {
  append<T>(
    key: string,
    fn: () => Promise<CacheEntry<T>>,
  ): Promise<CacheEntry<T>>
  request<T>(
    key: string,
    fn: () => Promise<CacheEntry<T>>,
  ): Promise<CacheEntry<T>>
}
export function RequestPool(): RequestPool {
  const pool = new Map<string, Promise<unknown>>()

  function set(key: string, request: Promise<unknown>) {
    pool.set(key, request)
    request.finally(() => {
      const current = pool.get(key)
      if (current === request) {
        pool.delete(key)
      }
    })
  }

  return {
    append<T>(key: string, fn: () => Promise<T>) {
      const previous = pool.get(key) ?? Promise.resolve()
      const request = previous.then(fn, fn)

      set(key, request)
      return request
    },
    request<T>(key: string, fn: () => Promise<T>) {
      if (pool.has(key)) {
        return pool.get(key) as Promise<T>
      }

      const request = fn()
      set(key, request)
      return request
    },
  }
}
