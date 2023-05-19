export type IndexedDBCache = {
  delete(key: string): Promise<void>
  get<T>(key: string): Promise<CacheEntry<T> | undefined>
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>
}
export type MemoryCache = {
  clear(): void
  delete(key: string): void
  get<T>(key: string): CacheEntry<T> | undefined
  set<T>(key: string, entry: CacheEntry<T>): void
}
export type CacheEntry<T = unknown> = {
  data: T
  updated: number
}
