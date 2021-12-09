import { derived, readable } from 'svelte/store'
import { getOrCreate } from '../_cache'
import { update as updateCache } from './update'
import type { MaybePromise, Updater } from './update'
import type { Readable, Writable } from 'svelte/store'
import type { SWRPlugin } from '../plugin'

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
  processing: Readable<boolean>
  error: Readable<Error | undefined>
  refresh: () => Promise<void>
  update: (fn: Updater<T>) => Promise<T | void>
}
const emptyKeyMock = {
  data: readable(undefined),
  error: readable(undefined),
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
type SWROptionsWithUpdater<T> = SWROptions<T> & Pick<SWROptions<T>, 'updater'>

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

  const onSubscribe = readable(undefined, () => {
    if (
      !store.last_update ||
      (maxAge !== undefined && Date.now() - maxAge > store.last_update)
    ) {
      refresh()
    }

    const unsubscribe_plugins = plugins.map((fn) => {
      return fn({
        key,
        data: store.data,
        error: store.error,
        refresh,
      })
    })

    return () => unsubscribe_plugins.forEach((i) => i?.())
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
    processing: derived(store.request, ($request) => !!$request),
    refresh: () => refresh(true),
    update<T>(fn: Updater<T>) {
      return updateCache<T>(key, fn)
    },
  }
}
