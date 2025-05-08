export type Fetcher<ID, T> = (key: string, params: ID) => MaybePromise<T>
export type MaybePromise<T> = T | Promise<T>
export type ModelName = string

export type CacheEntry<T> = {
  data: T
  updated: number
}

export type IndexedDBCache<T> = {
  clear(): Promise<void>
  delete(key: string): Promise<void>
  get(key: string): Promise<CacheEntry<T> | undefined>
  keys(): Promise<string[] | null>
  set(key: string, entry: CacheEntry<T>): Promise<void>
}

export function isFunction<T>(
  fn: T | ((data: T) => MaybePromise<T>),
): fn is (data: T) => MaybePromise<T> {
  return typeof fn === 'function'
}
