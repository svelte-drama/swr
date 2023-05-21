export type IndexedDBCache = {
  clear(): Promise<void>
  delete(key: string): Promise<void>
  get<T>(key: string): Promise<CacheEntry<T> | undefined>
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>
}
export type MemoryCache = {
  get<T>(key: string): CacheEntry<T> | undefined
}
export type CacheEntry<T = unknown> = {
  data: T
  updated: number
}