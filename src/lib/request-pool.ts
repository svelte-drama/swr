import type { CacheEntry } from '$lib/cache/types.js'

export type RequestPool<T> = {
  append(key: string, fn: () => Promise<CacheEntry<T>>): Promise<CacheEntry<T>>
  request(key: string, fn: () => Promise<CacheEntry<T>>): Promise<CacheEntry<T>>
}
export function RequestPool<T>(): RequestPool<T> {
  const pool = new Map<string, Promise<CacheEntry<T>>>()

  function set(key: string, request: Promise<CacheEntry<T>>) {
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
    request(key, fn) {
      if (pool.has(key)) {
        return pool.get(key)!
      }

      const request = fn()
      set(key, request)
      return request
    },
  }
}
