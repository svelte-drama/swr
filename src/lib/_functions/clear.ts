import { cache } from '../_cache.js'

export function clear(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
