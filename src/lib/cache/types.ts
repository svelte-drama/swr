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

export type MemoryCache<T> = {
  clear(): void
  delete(key: string): void
  get(key: string): CacheEntry<T> | undefined
  keys(): string[]
  set(key: string, entry: CacheEntry<T>): void
}

export type SWRCache<T> = {
  db: IndexedDBCache<T>
  memory: MemoryCache<T>
  clear(): Promise<void>
  delete(key: string): Promise<void>
  set(key: string, data: T): Promise<CacheEntry<T>>
}
