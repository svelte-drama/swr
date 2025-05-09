import { untrack } from 'svelte'
import {
  isFunction,
  type CacheEntry,
  type Fetcher,
  type MaybePromise,
  type ModelName,
} from './types.js'
import { createCache } from './cache.svelte.js'
import { createIndexedDBCache } from './indexed-db.js'
import { getLastRefresh } from './refresh.js'
import { Lock } from './lock.js'
import { Broadcaster, isEventSameOrigin } from './broadcaster.js'

export function swr<ID, T>(options: {
  fetcher: Fetcher<ID, T>
  key(params: ID): string
  maxAge: number
  name: ModelName
}) {
  const broadcaster = Broadcaster<T>(options.name)
  const db = createIndexedDBCache<T>(options.name, broadcaster)
  const cache = createCache<T>({ db })
  const lock = Lock(options.name)

  broadcaster.on((event) => {
    // Clearing all caches is triggered via event
    // All other events are duplicates of actions performed directly on this model
    switch (event.type) {
      case 'clear': {
        cache.clear()
        break
      }

      case 'clear_error': {
        cache.clearErrors()
        break
      }

      case 'data': {
        if (isEventSameOrigin(event)) return
        const entry = cache.get(event.key)
        if (entry.updated < event.data.updated) {
          entry.data = event.data.data
          entry.updated = event.data.updated
        }
        break
      }

      case 'delete': {
        if (isEventSameOrigin(event)) return
        cache.delete(event.key)
        break
      }
    }
  })

  function fetchFromServer(key: string, params: ID): Promise<T> {
    const entry = cache.get(key)
    entry.request = Promise.resolve(options.fetcher(key, params))
    return entry.request
  }

  async function fetchData(params: ID): Promise<T> {
    const key = options.key(params)
    const entry = cache.get(key)

    if (entry.request) return entry.request
    if (isCurrent(entry)) return entry.data

    return lock(key, async () => {
      // Check if data was updated while acquiring lock
      if (isCurrent(entry)) return entry.data

      const db_entry = await db.get(key)
      if (
        db_entry &&
        db_entry.data !== undefined &&
        db_entry.updated > entry.updated
      ) {
        entry.data = db_entry.data
        entry.updated = db_entry.updated
      }
      if (isCurrent(entry)) return entry.data

      return fetchFromServer(key, params)
    })
  }

  function isCurrent(entry: {
    data: T | undefined
    updated: number
  }): entry is CacheEntry<T> {
    return (
      entry.data !== undefined &&
      Date.now() <= entry.updated + options.maxAge &&
      getLastRefresh() <= entry.updated
    )
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
    const key = options.key(params)
    const stack = new Error('SWR: Unable to perform update')

    return lock(key, async () => {
      const entry = cache.get(key)
      if (isFunction(data)) {
        const initial =
          entry.data ??
          (await db.get(key))?.data ??
          (await fetchFromServer(key, params))
        entry.request = (async () => {
          try {
            return data(initial)
          } catch (e) {
            stack.cause = e
            throw stack
          }
        })()
        return entry.request
      } else {
        entry.data = data

        await db.set(key, {
          data: $state.snapshot(entry.data) as T,
          updated: entry.updated,
        })
        return data
      }
    })
  }

  return {
    async clear() {
      await db.clear()
      cache.clear()
    },
    async clearErrors() {
      cache.clearErrors()
    },
    async delete(params: ID) {
      const key = options.key(params)
      await lock(key, async () => {
        await db.delete(key)
        cache.delete(key)
      })
    },
    fetch: fetchData,
    get(params: ID | undefined): T | undefined {
      if (params === undefined) return

      const key = options.key(params)
      const entry = cache.get(key)
      if (!isCurrent(entry)) {
        untrack(() => fetchData(params))
      }

      if (entry.data === undefined && entry.error) {
        throw entry.error
      }
      return entry.data
    },
    async keys() {
      return (await db.keys()) ?? cache.keys()
    },
    async refresh(params: ID) {
      const key = options.key(params)
      return lock(key, () => fetchFromServer(key, params))
    },
    update,
  }
}
