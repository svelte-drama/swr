import { derived, readable } from 'svelte/store'
import { getOrCreate } from '../_cache'
import { update as updateCache } from './update'
import type { Updater } from './update'
import type { Readable, Writable } from 'svelte/store'
import type { SWRPlugin } from '../plugin'

function createRefresh<T>(key: string, fetcher: Fetcher<T>) {
  return async function (force = false) {
    return updateCache(key, () => fetcher(key), force)
  }
}

function makeReadable<T>(store: Writable<T>, onSubscribe: Readable<unknown>) {
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

type SWRResult<T> = {
  data: Readable<T | undefined>
  error: Readable<Error | undefined>
  refresh: () => Promise<void>
  update: (fn: Updater<T>) => Promise<T | undefined>
}
const emptyKeyMock = {
  data: readable(undefined),
  error: readable(undefined),
  refresh: async () => undefined,
  update: async () => undefined,
}

type Result<T> = T | Promise<T | undefined> | undefined | void
type Fetcher<T> = (key: string) => Result<T>
type UpdaterFn<T> = (key: string, data: T) => Result<T>

export type SWROptions<T> = {
  fetcher?: Fetcher<T>
  maxAge?: number
  plugins?: SWRPlugin[]
  updater?: UpdaterFn<T>
}

export function swr<T>(key?: string, options?: SWROptions<T>): SWRResult<T>
export function swr<T>(
  key: string | undefined,
  fetcher: Fetcher<T>
): SWRResult<T>
export function swr<T>(
  key: string | undefined,
  options: Fetcher<T> | SWROptions<T> = {}
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
    if (!store.last_update) {
      refresh()
    } else if (
      maxAge !== undefined &&
      Date.now() - maxAge > store.last_update
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

    return () => unsubscribe_plugins.forEach((i) => i && i())
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
    refresh: () => refresh(true),
    update<T>(fn: Updater<T>) {
      return updateCache<T>(key, fn)
    },
  }
}
