import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelVersion, Partition } from '$lib/types.js'

export type RequestPool = {
  append<T>(key: string, fn: () => Promise<T>): Promise<T>
  request<T>(key: string, fn: () => Promise<T>): Promise<T>
}
export function RequestPool(
  partition: Partition,
  version: ModelVersion
): RequestPool {
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
      const make_request = () => acquireLock(partition, version, key, fn)
      const previous = pool.get(key) ?? Promise.resolve()
      const request = previous.then(make_request, make_request)

      set(key, request)
      return request
    },
    request<T>(key: string, fn: () => Promise<T>) {
      if (pool.has(key)) {
        return pool.get(key) as Promise<T>
      }

      const request = acquireLock(partition, version, key, fn)
      set(key, request)
      return request
    },
  }
}

function acquireLock<T>(
  partition: Partition,
  version: ModelVersion,
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
      `${SWR_VERSION}${SEPARATOR}${partition}${SEPARATOR}${version}${SEPARATOR}${key}`,
      async () => {
        const result = await fn()
        resolve(result)
      }
    )
  })
}
