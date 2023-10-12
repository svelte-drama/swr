import type { CacheEntry } from '$lib/cache/types.js'

export type RequestPool = {
  append<T, R = CacheEntry<T>>(key: string, fn: () => Promise<R>): Promise<R>
  request<T, R = CacheEntry<T>>(key: string, fn: () => Promise<R>): Promise<R>
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
    append(key, fn) {
      const previous = pool.get(key) ?? Promise.resolve()
      const request = previous.then(fn, fn)

      set(key, request)
      return request
    },
    request<R>(key: string, fn: () => Promise<R>) {
      if (pool.has(key)) {
        return pool.get(key) as Promise<R>
      }

      const request = fn()
      set(key, request)
      return request
    },
  }
}
