import { Broadcaster } from '$lib/broadcaster.js'
import type { Broadcaster as BroadcasterType } from '$lib/broadcaster/types.js'
import { SWRCache } from '$lib/cache/swr-cache.js'
import type { SWRCache as SWRCacheType } from '$lib/cache/types.js'
import { RequestPool } from '$lib/request-pool.js'
import type { ModelName } from '$lib/types.js'
import { getOrSet } from '$lib/util/get-or-set.js'

export type Internals = {
  broadcaster: BroadcasterType
  cache: SWRCacheType
  request_pool: RequestPool
}
const internals_cache = new Map<ModelName, Internals>()

export function createInternals(model_name: ModelName) {
  return getOrSet<ModelName, Internals>(internals_cache, model_name, () => {
    const broadcaster = Broadcaster(model_name)
    const cache = SWRCache(model_name, broadcaster)

    return {
      broadcaster,
      cache,
      request_pool: RequestPool(model_name),
    }
  })
}
