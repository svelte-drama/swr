import { get } from 'svelte/store'
import { getOrCreate } from '../_cache.js'

export type MaybePromise<T> = Promise<T> | T
export type Updater<T> = (value?: T) => MaybePromise<T | void>
type DataParam<T> = Updater<T> | MaybePromise<T | void>

// This is just to make typescript happy
function isFunction<T>(data: DataParam<T>): data is Updater<T> {
  return typeof data === 'function'
}

export async function update<T>(
  key: string,
  data?: DataParam<T>,
  force = true
) {
  const store = getOrCreate<T>(key)

  if (data === undefined) {
    store.stale.set(true)
    return
  }

  if (!force) {
    const previous_request = get(store.request)
    if (previous_request) return previous_request
  }

  let request: Promise<T | void>
  if (isFunction(data)) {
    const current_value = get(store.data)
    request = Promise.resolve(data(current_value))
  } else {
    request = Promise.resolve(data)
  }

  store.request.set(request)

  try {
    const result = await request
    if (get(store.request) === request) {
      if (result !== undefined) {
        store.data.set(result)
        store.error.set(undefined)
        store.last_update.set(Date.now())
        store.stale.set(false)
      }
      store.request.set(undefined)
    }
    return result
  } catch (e) {
    if (get(store.request) === request) {
      if (e instanceof Error) {
        store.error.set(e)
      } else {
        const error = new Error(e + '')
        store.error.set(error)
      }
      store.last_update.set(Date.now())
      store.request.set(undefined)
      store.stale.set(false)
    }
    throw e
  }
}
