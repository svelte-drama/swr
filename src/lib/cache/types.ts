export type Cache = {
  clear?(): Promise<void>
  delete(key: string): Promise<void>
  get<T>(key: string): Promise<CacheEntry<T> | undefined>
  set<T>(key: string, data: T): Promise<CacheEntry<T>>
}
export type CacheEntry<T = unknown> = {
  data: T
  updated: number
}
