import { Broadcaster } from '$lib/broadcaster.js'
import type { Broadcaster as BroadcasterType } from '$lib/broadcaster/types.js'
import { SWRCache } from '$lib/cache/swr-cache.svelte.js'
import type { SWRCache as SWRCacheType } from '$lib/cache/types.js'
import { Lock, type LockFn } from '$lib/lock.js'
import { RequestPool } from '$lib/request-pool.js'
import type { ModelName } from '$lib/types.js'
import { getOrSet } from '$lib/util/get-or-set.js'

export type Internals<T> = {
  broadcaster: BroadcasterType
  cache: SWRCacheType<T>
  lock: LockFn
  request_pool: RequestPool<T>
}
const internals_cache = new Map<ModelName, Internals<any>>()

export function createInternals<T>(model_name: ModelName) {
  return getOrSet<ModelName, Internals<T>>(internals_cache, model_name, () => {
    const broadcaster = Broadcaster(model_name)

    return {
      broadcaster,
      cache: SWRCache(model_name, broadcaster),
      lock: Lock(model_name),
      request_pool: RequestPool(),
    }
  })
}
