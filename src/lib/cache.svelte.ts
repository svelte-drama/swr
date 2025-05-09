import { SvelteMap } from 'svelte/reactivity'
import type { IndexedDBCache } from '$lib/types.js'

type Cache<T> = {
  data: Map<
    string,
    {
      data: T
      updated: number
    }
  >
  error: Map<string, Error>
  request: Map<string, Promise<T>>
}

class CacheEntry<T> {
  #cache: Cache<T>
  #db: IndexedDBCache<T>
  #key: string

  constructor(options: {
    cache: Cache<T>
    key: string
    db: IndexedDBCache<T>
  }) {
    this.#cache = options.cache
    this.#db = options.db
    this.#key = options.key
  }

  get data() {
    return this.#cache.data.get(this.#key)?.data
  }
  set data(value) {
    if (value === undefined) {
      this.#cache.data.delete(this.#key)
      return
    }

    const previous = this.#cache.data.get(this.#key)
    // If data has not changed, reuse old object to reduce rerenders
    const entry = {
      data:
        previous && isEquivalent(previous.data, value) ? previous.data : value,
      updated: Date.now(),
    }
    this.#cache.data.set(this.#key, entry)
    this.error = undefined
  }
  get error() {
    return this.#cache.error.get(this.#key)
  }
  set error(value) {
    if (!value) {
      this.#cache.error.delete(this.#key)
      return
    }

    this.#cache.error.set(this.#key, value)
    this.updated = Date.now()
  }
  get request() {
    return this.#cache.request.get(this.#key)
  }
  set request(value) {
    if (!value) {
      this.#cache.request.delete(this.#key)
      return
    }

    const request = value
      .then(async (data) => {
        if (request === this.request) {
          this.data = data

          await this.#db.set(this.#key, {
            data: $state.snapshot(this.data) as T,
            updated: this.updated,
          })
        }
        return data
      })
      .catch((e) => {
        if (request === this.request) {
          this.error = e
        }
        throw e
      })
      .finally(() => {
        if (request === this.request) {
          this.request = undefined
        }
      })
    this.#cache.request.set(this.#key, request)
  }
  get updated() {
    return this.#cache.data.get(this.#key)?.updated ?? 0
  }
  set updated(value) {
    const data = this.#cache.data.get(this.#key)
    if (data) {
      data.updated = value
    }
  }

  toJSON() {
    return JSON.stringify({
      data: this.data,
      updated: this.updated,
    })
  }
}

export function createCache<T>(options: { db: IndexedDBCache<T> }) {
  const cache: Cache<T> = {
    data: new SvelteMap(),
    error: new SvelteMap(),
    request: new Map(),
  }

  return {
    clear() {
      cache.data.clear()
      cache.error.clear()
      cache.request.clear()
    },
    clearErrors() {
      cache.error.clear()
    },
    delete(key: string) {
      cache.data.delete(key)
      cache.error.delete(key)
      cache.request.delete(key)
    },
    get(key: string) {
      return new CacheEntry({
        cache,
        db: options.db,
        key,
      })
    },
    keys() {
      const keys = new Set(
        ...cache.data.keys(),
        ...cache.error.keys(),
        ...cache.request.keys(),
      )
      return [...keys]
    },
  }
}

function isEquivalent(a: unknown, b: unknown) {
  // If this is a plain object, try comparing JSON strings
  // This will have issues if there are nested Maps, Sets, etc.
  // typeof null === 'object', so check for that first
  if (a && typeof a === 'object' && a.constructor === Object) {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  return a === b
}
