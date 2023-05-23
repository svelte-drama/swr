import { readable } from 'svelte/store'
import { atomicUpdate } from '$lib/swr/atomic-update.js'
import { fetch } from '$lib/swr/fetch.js'
import { createInternals } from '$lib/swr/internals.js'
import { live } from '$lib/swr/live.js'
import { refresh } from '$lib/swr/refresh.js'
import { update as runUpdate } from '$lib/swr/update.js'
import type {
  Fetcher,
  MaybePromise,
  ModelName,
  SuspenseFn,
} from '$lib/types.js'
import { createCacheEntry } from './cache/create-cache-entry.js'

export function swr<ID, T>(options: {
  fetcher: Fetcher<ID, T>
  key(params: ID): string
  maxAge?: number
  name?: ModelName
}) {
  const createKey = options.key
  const model_name = options.name ?? ''
  const internals = createInternals(model_name)

  function getOptions(params: ID) {
    const key = createKey(params)
    const fetcher = async () => {
      return options.fetcher(key, params)
    }
    const saveToCache = (data: T) => {
      const cache_entry = createCacheEntry(data)
      // Do not await writing to disk
      internals.db.set(key, cache_entry)
      internals.memory.set(key, cache_entry)
      return cache_entry
    }

    return {
      ...internals,
      key,
      fetcher,
      maxAge: options.maxAge ?? 0,
      saveToCache,
    }
  }

  async function update(params: ID, data: T): Promise<T>
  async function update(
    params: ID,
    fn: (data: T) => MaybePromise<T>
  ): Promise<T>
  async function update(params: ID, data: T | ((data: T) => MaybePromise<T>)) {
    const options = getOptions(params)
    const entry = isFunction(data)
      ? atomicUpdate<T>(options, data)
      : runUpdate<T>(options, data)
    return (await entry).data
  }

  return {
    async clear() {
      await internals.db.clear()
      internals.memory.clear()
    },
    async delete(params: ID) {
      const key = createKey(params)
      await internals.db.delete(key)
      internals.memory.delete(key)
    },
    async fetch(params: ID): Promise<T> {
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
    async refresh(params: ID): Promise<T> {
      const options = getOptions(params)
      const entry = await refresh<T>(options)
      return entry.data
    },
    update,
  }
}

function isFunction<T>(
  fn: T | ((data: T) => MaybePromise<T>)
): fn is (data: T) => MaybePromise<T> {
  return typeof fn === 'function'
}
