import type { ReadableSignalStore } from '@svelte-drama/signal-store'

export type CacheEntry<T = unknown> = {
  data: T
  updated: number
}

export type IndexedDBCache = {
  clear(): Promise<void>
  delete(key: string): Promise<void>
  get<T>(key: string): Promise<CacheEntry<T> | undefined>
  keys(): Promise<string[] | null>
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>
}

export type MemoryCache = {
  clear(): void
  delete(key: string): void
  get<T>(key: string): CacheEntry<T> | undefined
  keys(): string[]
  set<T>(key: string, entry: CacheEntry<T>): void
}

export type StoreCache = {
  clear(): void
  delete(key: string): void
  get<T>(
    key: string,
    runFetch: () => Promise<unknown>,
  ): {
    data: ReadableSignalStore<T | undefined>
    error: ReadableSignalStore<Error | undefined>
  }
  set(key: string, entry: CacheEntry): void
  setError(key: string, error: Error): void
}

export type SWRCache = {
  db: IndexedDBCache
  memory: MemoryCache
  stores: StoreCache
  clear(): Promise<void>
  delete(key: string): Promise<void>
  set<T>(key: string, data: T, force?: boolean): Promise<CacheEntry<T>>
}
