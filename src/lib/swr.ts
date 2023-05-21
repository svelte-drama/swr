import { readable } from 'svelte/store'
import { atomicUpdate } from '$lib/model/atomic-update.js'
import { fetch } from '$lib/model/fetch.js'
import { createInternals } from '$lib/model/internals.js'
import { live } from '$lib/model/live.js'
import { refresh } from '$lib/model/refresh.js'
import { update as runUpdate } from '$lib/model/update.js'
import type {
  Fetcher,
  MaybePromise,
  ModelName,
  SuspenseFn,
} from '$lib/types.js'

export function swr<ID, T>(
  options: {
    fetcher: Fetcher<ID, T>
    key(params: ID): string
    maxAge?: number
    name?: ModelName
  }
) {
  const createKey = options.key
  const model_name = options.name ?? ''
  const internals = createInternals(model_name)

  function getOptions(params: ID) {
    const key = createKey(params)
    const fetcher = async () => {
      return options.fetcher(key, params)
    }
    return {
      ...internals,
      key,
      fetcher,
      maxAge: options.maxAge ?? 0
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
    async clear() {
      await internals.db.clear()
      internals.broadcaster.dispatchClear()
    },
    async delete(params: ID) {
      const key = createKey(params)
      await internals.db.delete(key)
      internals.broadcaster.dispatchDelete(key)
    },
    async fetch(params: ID) {
      const options = getOptions(params)
      const entry = await fetch<T>(options)
      return entry.data
    },
    live(params?: ID, suspend?: SuspenseFn) {
      // If createKey.length is zero, then there are no required params
      if (createKey.length && params === undefined) {
        return readable<undefined>()
      }
      const options = getOptions(params!)
      const runFetch = () => fetch(options)
      return live<T>(options, runFetch, suspend)
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
