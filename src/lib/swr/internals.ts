import { Broadcaster } from '$lib/broadcaster.js'
import type { Broadcaster as BroadcasterType } from '$lib/broadcaster/types.js'
import { SWRCache } from '$lib/cache/swr-cache.js'
import type { SWRCache as SWRCacheType } from '$lib/cache/types.js'
import { Lock, type LockFn } from '$lib/lock.js'
import { RequestPool } from '$lib/request-pool.js'
import type { ModelName } from '$lib/types.js'
import { getOrSet } from '$lib/util/get-or-set.js'

export type Internals = {
  broadcaster: BroadcasterType
  cache: SWRCacheType
  lock: LockFn
  request_pool: RequestPool
}
const internals_cache = new Map<ModelName, Internals>()

export function createInternals(model_name: ModelName) {
  return getOrSet<ModelName, Internals>(internals_cache, model_name, () => {
    const broadcaster = Broadcaster(model_name)
    const cache = SWRCache(model_name, broadcaster)
    const lock = Lock(model_name)

    return {
      broadcaster,
      cache,
      lock,
      request_pool: RequestPool(),
    }
  })
}
