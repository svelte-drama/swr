import { get } from 'svelte/store'
import { getOrCreate } from '../_cache'

export type MaybePromise<T> = T | Promise<T>
// eslint-disable-next-line @typescript-eslint/ban-types
type NotFunction<T> = Exclude<T, Function>

export type Updater<T> = (value?: T) => MaybePromise<T | undefined>
type DataParam<T> = NotFunction<T> | Promise<T> | Updater<T>

// This is just to make typescript happy
function isFunction<T>(data: DataParam<T>): data is Updater<T> {
  return typeof data === 'function'
}

export async function update<T>(
  key: string,
  data: DataParam<T | void>,
  force = true
) {
  const store = getOrCreate<T>(key)

  if (!force && store.request) return store.request

  const request = isFunction(data) ? data(get(store.data)) : data
  store.request = Promise.resolve(request)

  try {
    const result = await request
    if (result !== undefined && store.request === request) {
      store.data.set(result)
      store.error.set(undefined)
      store.last_update = Date.now()
      store.request = undefined
    }
    return result
  } catch (e) {
    if (store.request === request) {
      store.error.set(e)
      store.last_update = Date.now()
      store.request = undefined
    }
    throw e
  }
}
