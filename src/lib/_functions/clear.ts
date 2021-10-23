import { cache } from '../_cache'

export function clear(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
