import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelName } from '$lib/types.js'
import type { CacheEntry, IndexedDBCache } from './types.js'

const DATABASE_NAME = '$$swr'
const STORE_NAME = 'cache'

export function IndexedDBCache<T>(model_name: ModelName): IndexedDBCache<T> {
  const cache =
    typeof indexedDB === 'undefined'
      ? mockCache
      : CreateIndexedDBCache(model_name).catch((e) => {
          console.error(e)
          return mockCache
        })

  return {
    async clear() {
      return (await cache).clear()
    },
    async delete(key) {
      return (await cache).delete(key)
    },
    async get(key) {
      return (await cache).get(key)
    },
    async keys() {
      return (await cache).keys()
    },
    async set(key, data) {
      return (await cache).set(key, data)
    },
  }
}

const mockCache: IndexedDBCache<any> = {
  async clear() {},
  async delete() {},
  async get() {
    return undefined
  },
  async keys() {
    return null
  },
  async set() {},
}

async function CreateIndexedDBCache<T>(
  model_name: ModelName,
): Promise<IndexedDBCache<T>> {
  await openDatabase().then(removeOldRecords)
  const getKey = (key: string) => `${model_name}${SEPARATOR}${key}`

  function getKeyRange() {
    const start = getKey('')
    const char_code = start.charCodeAt(start.length - 1)
    const next_char = String.fromCharCode(char_code + 1)
    const end = start.substring(0, start.length - 1) + next_char

    return IDBKeyRange.bound(start, end, false, true)
  }

  return {
    async clear() {
      await makeRequest('readwrite', (store) => {
        const range = getKeyRange()
        return store.delete(range)
      })
    },
    async delete(key) {
      await makeRequest('readwrite', (store) => {
        const db_key = getKey(key)
        return store.delete(db_key)
      })
    },
    async get(key) {
      return makeRequest('readonly', (store) => {
        const db_key = getKey(key)
        return store.get(db_key)
      })
    },
    async keys() {
      const keys = await makeRequest('readonly', (store) => {
        const range = getKeyRange()
        return store.getAllKeys(range)
      })
      return keys.map((key) => {
        const [_prefix, value] = key.toString().split(SEPARATOR)
        return value
      })
    },
    async set(key, entry) {
      await makeRequest('readwrite', (store) => {
        const db_key = getKey(key)
        return store.put(entry, db_key)
      })
    },
  }
}

export async function clearDatabase() {
  return makeRequest('readwrite', (store) => {
    return store.clear()
  })
}

async function makeRequest<T>(
  access: 'readonly' | 'readwrite',
  fn: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openDatabase()
  const transaction = db.transaction(STORE_NAME, access, {
    durability: 'relaxed',
  })
  const store = transaction.objectStore(STORE_NAME)
  return new Promise<T>((resolve, reject) => {
    const request = fn(store)
    rejectOnError(request, reject)
    request.onsuccess = (e) => {
      const target = e.target as IDBRequest
      resolve(target.result)
      try {
        transaction.commit?.()
      } catch (e) {
        if (e instanceof Error && e.name === 'InvalidStateError') {
          // Manually closing transactions is optional anyways
          // We do it simply for minor performance gains
        } else {
          throw e
        }
      }
    }
  })
}

const openDatabase = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, SWR_VERSION)
    rejectOnError(request, reject)
    request.onsuccess = (e: Event) => {
      const target = e.target as IDBRequest<IDBDatabase>
      resolve(target.result)
    }
    request.onupgradeneeded = (e) => {
      const target = e.target as IDBOpenDBRequest
      const db = target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

function rejectOnError(request: IDBRequest, reject: (reason?: any) => void) {
  request.onerror = (e: Event) => {
    const target = e.target as IDBRequest<IDBDatabase>
    reject(target.error)
  }
}

async function removeOldRecords(db: IDBDatabase) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    // Delete all records more than a week old
    const a_week_ago = Date.now() - 7 * 24 * 60 * 60 * 1000
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.openCursor()
    rejectOnError(request, reject)

    request.onsuccess = (e) => {
      const target = e.target as IDBRequest<IDBCursorWithValue | null>
      const cursor = target.result
      if (cursor) {
        const entry: CacheEntry | null = cursor.value
        if (!(entry?.updated && entry.updated > a_week_ago)) {
          store.delete(cursor.key)
        }
        cursor.continue()
      }
    }
    transaction.oncomplete = () => {
      resolve(db)
    }
  })
}
