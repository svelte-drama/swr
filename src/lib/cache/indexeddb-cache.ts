import type { Broadcaster } from '$lib/broadcaster/types.js'
import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { ModelVersion, Partition } from '$lib/types.js'
import { getOrSet } from '$lib/util/get-or-set.js'
import { MemoryCache } from './memory-cache.js'
import type { Cache, CacheEntry } from './types.js'

const DB_CONNECTIONS = new Map<Partition, Promise<IDBDatabase>>()
const STORE_NAME = 'cache'

export async function clearDatabaseParition(partition: Partition) {
  const db = await openDatabase(partition)
  return makeRequest(db, 'readwrite', store => store.clear())
}

export function IndexedDBCache({
  broadcaster,
  partition,
  version,
}: {
  broadcaster: Broadcaster
  partition: Partition
  version: ModelVersion
}): Cache {
  const cache = CreateIndexedDBCache(partition, version).catch((e) => {
    console.error(e)
    return MemoryCache(broadcaster)
  })

  return {
    async clear() {
      return (await cache).clear?.()
    },
    async delete(key) {
      return (await cache).delete(key)
    },
    async get(key) {
      return (await cache).get(key)
    },
    async set(key, data) {
      return (await cache).set(key, data)
    },
  }
}

async function CreateIndexedDBCache(
  partition: Partition,
  version: ModelVersion
): Promise<Cache> {
  // Open database connection
  const db = await getOrSet(DB_CONNECTIONS, partition, async () => {
    return openDatabase(partition).then(removeOldRecords)
  })

  function getKey(key: string) {
    return `${version}${SEPARATOR}${key}`
  }

  return {
    async delete(key) {
      await makeRequest(db, 'readwrite', (store) => {
        const db_key = getKey(key)
        return store.delete(db_key)
      })
    },
    async get(key) {
      return makeRequest(db, 'readonly', (store) => {
        const db_key = getKey(key)
        return store.get(db_key)
      })
    },
    async set<T>(key: string, data: T): Promise<CacheEntry<T>> {
      const entry: CacheEntry<T> = {
        data,
        updated: Date.now(),
      }
      await makeRequest(db, 'readwrite', (store) => {
        const db_key = getKey(key)
        return store.put(entry, db_key)
      })
      return entry
    },
  }
}

async function makeRequest<T>(
  db: IDBDatabase,
  access: 'readonly' | 'readwrite',
  fn: (store: IDBObjectStore) => IDBRequest<T>
) {
  const transaction = db.transaction(STORE_NAME, access)
  const store = transaction.objectStore(STORE_NAME)
  return new Promise<T>((resolve, reject) => {
    const request = fn(store)
    rejectOnError(request, reject)
    request.onsuccess = (e) => {
      const target = e.target as IDBRequest
      resolve(target.result)
    }
  })
}

function openDatabase(partition: Partition) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(`${SEPARATOR}${partition}`, SWR_VERSION)
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
        const entry: CacheEntry = cursor.value
        if (entry.updated < a_week_ago) {
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
