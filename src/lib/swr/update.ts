import type { CacheEntry, SWRCache } from '$lib/cache/types.js'

type UpdateParams<T> = {
  cache: SWRCache
  key: string
}
export function update<T>(
  { cache, key }: UpdateParams<T>,
  data: T
): CacheEntry<T> {
  return cache.set(key, data)
}
