import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelName } from '$lib/types.js'

export type RequestPool = {
  append<T>(key: string, fn: () => Promise<T>): Promise<T>
  request<T>(key: string, fn: () => Promise<T>): Promise<T>
}
export function RequestPool(model_name: ModelName): RequestPool {
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
      const make_request = () => acquireLock(model_name, key, fn)
      const previous = pool.get(key) ?? Promise.resolve()
      const request = previous.then(make_request, make_request)

      set(key, request)
      return request
    },
    request<T>(key: string, fn: () => Promise<T>) {
      if (pool.has(key)) {
        return pool.get(key) as Promise<T>
      }

      const request = acquireLock(model_name, key, fn)
      set(key, request)
      return request
    },
  }
}

function acquireLock<T>(
  model_name: ModelName,
  key: string,
  fn: () => Promise<T>
) {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    // If navigator.locks is not supported, we just rely on the request
    // pool to deduplicate requests from inside the same tab
    return fn()
  }

  return new Promise<T>((resolve) => {
    navigator.locks.request(
      `${SWR_VERSION}${SEPARATOR}${model_name}${SEPARATOR}${key}`,
      async () => {
        const result = await fn()
        resolve(result)
      }
    )
  })
}
