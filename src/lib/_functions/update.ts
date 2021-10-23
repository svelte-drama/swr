import { get } from 'svelte/store'
import { getOrCreate } from '../_cache'

export type Updater<T> = (value?: T) => T | Promise<T | undefined> | undefined

export async function update<T>(key: string, fn: Updater<T>, force = true) {
  const store = getOrCreate<T>(key)

  if (!force && store.request) return store.request

  const current = get(store.data)
  const request = Promise.resolve(fn(current))
  store.request = request

  try {
    const result = await request
    if (result === undefined) {
      return
    }

    if (store.request === request) {
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
