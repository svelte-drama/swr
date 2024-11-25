import { atomicUpdate } from '$lib/swr/atomic-update.js'
import { fetch } from '$lib/swr/fetch.js'
import { createInternals } from '$lib/swr/internals.js'
import { refresh } from '$lib/swr/refresh.js'
import { update as runUpdate } from '$lib/swr/update.js'
import type { Fetcher, MaybePromise, ModelName, SWRModel } from '$lib/types.js'
import { readable, toStore } from 'svelte/store'

export function swr<ID, T>(options: {
  fetcher: Fetcher<ID, T>
  key(params: ID): string
  maxAge: number
  name: ModelName
}) {
  const createKey = options.key
  const model_name = options.name ?? ''
  const internals = createInternals<T>(model_name)

  function getOptions(params: ID) {
    const key = createKey(params)
    const fetcher = async () => {
      return options.fetcher(key, params)
    }

    return {
      ...internals,
      key,
      fetcher,
      maxAge: options.maxAge,
    }
  }

  async function update(params: ID, data: T): Promise<T>
  async function update(
    params: ID,
    fn: (data: T) => MaybePromise<T>,
  ): Promise<T>
  async function update(
    params: ID,
    data: T | ((data: T) => MaybePromise<T>),
  ): Promise<T> {
    const options = getOptions(params)
    if (isFunction(data)) {
      const entry = await atomicUpdate<T>(options, data)
      return entry.data
    } else {
      const entry = await runUpdate<T>(options, data)
      return entry.data
    }
  }

  return {
    async clear() {
      await internals.cache.clear()
    },
    async delete(params: ID) {
      const key = createKey(params)
      await internals.lock(key, true, async () => {
        await internals.cache.delete(key)
      })
    },
    get(params: ID | undefined): SWRModel<T> {
      if (params === undefined) {
        const null_promise = new Promise<T>(() => {})
        return {
          error: undefined,
          value: undefined,

          [Symbol.toStringTag]: 'SWRModel',
          catch(reject) {
            return null_promise.catch(reject)
          },
          finally(fn) {
            return null_promise.finally(fn)
          },
          then(resolve, reject) {
            return null_promise.then(resolve, reject)
          },

          get subscribe() {
            const store = readable(undefined)
            Object.defineProperty(this, 'subscribe', store.subscribe)
            return store.subscribe
          },
        }
      }

      const options = getOptions(params)
      const key = createKey(params)
      getData()

      let error = $state<Error | undefined>(undefined)

      const value = $derived.by(() => {
        const value = internals.cache.memory.get(key)?.data
        if (value === undefined) getData()
        return value
      })
      const promise = $derived.by(() => {
        return value === undefined ? getData() : Promise.resolve(value)
      })

      async function getData() {
        try {
          const entry = await fetch<T>(options)
          error = undefined
          return entry.data
        } catch (e) {
          error = e as Error
          throw e
        }
      }

      return {
        get error() {
          return error
        },
        get value() {
          return value
        },

        [Symbol.toStringTag]: 'SWRModel',
        get catch() {
          return promise.catch.bind(promise)
        },
        get finally() {
          return promise.finally.bind(promise)
        },
        get then() {
          return promise.then.bind(promise)
        },

        get subscribe() {
          const store = toStore(() => value)
          Object.defineProperty(this, 'subscribe', store.subscribe)
          return store.subscribe
        },
      }
    },
    async keys() {
      return (await internals.cache.db.keys()) ?? internals.cache.memory.keys()
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
  fn: T | ((data: T) => MaybePromise<T>),
): fn is (data: T) => MaybePromise<T> {
  return typeof fn === 'function'
}
