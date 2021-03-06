import { derived, get as getValue, readable } from 'svelte/store'
import type { Readable, Writable } from 'svelte/store'
import { getOrCreate } from '../_cache.js'
import type { SWRPlugin } from '../types.js'
import { update as updateCache } from './update.js'
import type { MaybePromise, Updater } from './update.js'

function createRefresh<T>(key: string, fetcher: FetcherFn<T>) {
  return async function (force = false) {
    return updateCache<T>(key, () => fetcher(key), force)
  }
}

function makeReadable<T>(store: Readable<T>, onSubscribe: Readable<unknown>) {
  return derived([store, onSubscribe], ([$store]) => $store)
}

type MakeWritableParams<T> = {
  key: string
  store: Writable<T>
  onSubscribe: Readable<unknown>
  updater: UpdaterFn<T>
}
function makeWritable<T>({
  key,
  store,
  onSubscribe,
  updater,
}: MakeWritableParams<T>) {
  const subscribe = makeReadable(store, onSubscribe).subscribe

  const set = async (value: T) => {
    store.set(value)
    await updateCache(key, () => updater(key, value))
  }

  const update = async (fn: (value: T) => T) => {
    let result: T
    store.update((value) => {
      if (value === undefined) {
        throw new Error('Data updated before initialization')
      }
      result = fn(value)
      return result
    })
    await updateCache(key, () => updater(key, result))
  }

  return {
    set,
    subscribe,
    update,
  } as Writable<T>
}

export type SWRResult<T, Result = Readable<T | undefined>> = {
  data: Result
  error: Readable<Error | undefined>
  fetch: () => Promise<T>
  processing: Readable<boolean>
  refresh: () => Promise<void>
  update: (fn: Updater<T>) => Promise<T | void>
}
const emptyKeyMock = {
  data: readable(undefined),
  error: readable(undefined),
  fetch: async () => {
    throw new Error('Undefined key')
  },
  processing: readable(false),
  refresh: async () => undefined,
  update: async () => undefined,
}

type FetcherFn<T> = (key: string) => MaybePromise<T | void>
type UpdaterFn<T> = (key: string, data: T) => MaybePromise<T | void>

export type SWROptions<T> = {
  fetcher?: FetcherFn<T>
  maxAge?: number
  plugins?: SWRPlugin[]
  updater?: UpdaterFn<T>
}
type SWROptionsWithUpdater<T> = SWROptions<T> &
  Required<Pick<SWROptions<T>, 'updater'>>

export function swr<T>(key: string | undefined): SWRResult<T>
export function swr<T>(
  key: string | undefined,
  options: SWROptionsWithUpdater<T>
): SWRResult<T, Writable<T | undefined>>
export function swr<T>(
  key: string | undefined,
  options: SWROptions<T>
): SWRResult<T>
export function swr<T>(
  key: string | undefined,
  fetcher: FetcherFn<T>
): SWRResult<T>
export function swr<T>(
  key: string | undefined,
  options: FetcherFn<T> | SWROptions<T> = {}
): SWRResult<T> {
  if (!key) {
    return emptyKeyMock
  }

  if (typeof options === 'function') {
    options = {
      fetcher: options,
    } as SWROptions<T>
  }

  const {
    fetcher = (url: string) => fetch(url).then((r) => r.json()),
    maxAge,
    plugins = [],
    updater,
  } = options

  const store = getOrCreate<T>(key)
  const refresh = createRefresh(key, fetcher)

  function isExpired() {
    return (
      maxAge !== undefined && Date.now() - maxAge > getValue(store.last_update)
    )
  }

  const onSubscribe = readable(undefined, () => {
    if (isExpired()) {
      refresh()
    }

    const stale_unsubscribe = store.stale.subscribe((is_stale) => {
      if (is_stale) refresh()
    })

    const unsubscribe_plugins = plugins.map((fn) => {
      return fn({
        key,
        data: store.data,
        error: store.error,
        last_update: store.last_update,
        refresh,
      })
    })

    return () => {
      stale_unsubscribe()
      unsubscribe_plugins.forEach((i) => i?.())
    }
  })

  const data = updater
    ? makeWritable({
        key,
        store: store.data,
        onSubscribe,
        updater,
      })
    : makeReadable(store.data, onSubscribe)

  return {
    data,
    error: makeReadable(store.error, onSubscribe),
    async fetch() {
      if (isExpired() || getValue(store.stale)) return refresh()

      const value = getValue(store.data)
      return value === undefined ? refresh() : value
    },
    processing: derived(store.request, ($request) => !!$request),
    refresh: () => refresh(true),
    update<T>(fn: Updater<T>) {
      return updateCache<T>(key, fn)
    },
  }
}
