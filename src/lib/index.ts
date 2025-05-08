import { dispatchClearAll, dispatchClearAllErrors } from '$lib/broadcaster.js'
import { clearDatabase } from '$lib/indexed-db.js'
export { swr } from '$lib/swr.svelte.js'

export async function clear() {
  try {
    if (typeof indexedDB !== 'undefined') {
      await clearDatabase()
    }
  } finally {
    dispatchClearAll()
  }
}

export async function clearErrors() {
  dispatchClearAllErrors()
}
