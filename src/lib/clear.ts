import { dispatchClearAll } from '$lib/broadcaster.js'
import { clearDatabase } from '$lib/indexed-db.js'

export async function clear() {
  try {
    if (typeof indexedDB !== 'undefined') {
      await clearDatabase()
    }
  } finally {
    dispatchClearAll()
  }
}
