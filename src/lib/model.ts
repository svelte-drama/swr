import { Broadcaster } from '$lib/broadcaster.js'
import type { Broadcaster as BroadcasterType } from '$lib/broadcaster/types.js'
import { IndexedDBCache } from '$lib/cache/indexeddb-cache.js'
import { MemoryCache } from '$lib/cache/memory-cache.js'
import type { Cache } from '$lib/cache/types.js'
import { atomicUpdate } from '$lib/model/atomic-update.js'
import { fetch } from '$lib/model/fetch.js'
import { live } from '$lib/model/live.js'
import { refresh } from '$lib/model/refresh.js'
import { update as runUpdate } from '$lib/model/update.js'
import { RequestPool } from '$lib/request-pool.js'
import type {
  CreateSuspenseFn,
  Fetcher,
  MaybePromise,
  ModelVersion,
  Partition,
} from '$lib/types.js'
import { getOrSet } from '$lib/util/get-or-set.js'
import { readable } from 'svelte/store'

type Shared = {
  broadcaster: BroadcasterType
  cache: Cache
  request_pool: RequestPool
}
const shared_cache = new Map<Partition, Map<ModelVersion, Shared>>()

export type ModelParams<ID, T> = {
  fetcher: Fetcher<ID, T>
  key(params: ID): string
  maxAge?: number
  version?: ModelVersion
}
type ModelPrivateOptions = {
  maxAge: number
  partition: Partition
  suspense?: CreateSuspenseFn
}
export function model<ID, T>(
  model_options: ModelParams<ID, T>,
  swr_options: ModelPrivateOptions
) {
  const createKey = model_options.key

  const partition = swr_options.partition
  const version = model_options.version ?? ''
  const partition_internals = getOrSet<Partition, Map<ModelVersion, Shared>>(
    shared_cache,
    partition,
    () => new Map()
  )
  const internals = getOrSet<ModelVersion, Shared>(
    partition_internals,
    version,
    () => {
      const broadcaster = Broadcaster(partition, version)
      const cache =
        typeof indexedDB === 'undefined'
          ? MemoryCache(broadcaster)
          : IndexedDBCache({
              broadcaster,
              partition,
              version,
            })
      return {
        broadcaster,
        cache,
        request_pool: RequestPool(partition, version),
      }
    }
  )

  function getOptions(params: ID) {
    const key = createKey(params)
    const fetcher = async () => {
      return model_options.fetcher(key, params)
    }
    return {
      ...swr_options,
      ...model_options,
      ...internals,
      key,
      fetcher,
    }
  }

  function update(params: ID, data: T): Promise<T>
  function update(params: ID, fn: (data: T) => MaybePromise<T>): Promise<T>
  function update(params: ID, data: T | ((data: T) => MaybePromise<T>)) {
    const options = getOptions(params)
    if (isFunction(data)) {
      return atomicUpdate<T>(options, data)
    } else {
      return runUpdate<T>(options, data)
    }
  }

  return {
    fetch(params: ID) {
      const options = getOptions(params)
      return fetch<T>(options)
    },
    live(params?: ID) {
      if (createKey.length && params === undefined) {
        return readable<undefined>()
      }
      // If createKey.length is zero, then there are no required params
      const options = getOptions(params!)
      return live<T>(options)
    },
    refresh(params: ID) {
      const options = getOptions(params)
      return refresh<T>(options)
    },
    update,
  }
}

function isFunction<T>(
  fn: T | ((data: T) => MaybePromise<T>)
): fn is (data: T) => MaybePromise<T> {
  return typeof fn === 'function'
}
