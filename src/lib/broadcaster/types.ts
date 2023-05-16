import type { CacheEntry } from '$lib/cache/types.js'

export type Broadcaster = {
  dispatch(key: string, data: CacheEntry): void
  dispatchError(key: string, error: unknown): void
  onAllData(
    fn: (message: BroadcastMessage & { foreign: boolean }) => void
  ): () => void
  onData<T>(key: string, fn: (data: CacheEntry<T>) => void): () => void
  onError(key: string, fn: (error: unknown) => void): () => void
}
export type BroadcastChannel<T> = {
  dispatch: (data: T) => void
  subscribe: (fn: (data: T) => void) => () => void
}
export type BroadcastError = {
  error: unknown
  key: string
  source: string
}
export type BroadcastMessage<T = unknown> = {
  data: CacheEntry<T>
  key: string
  source: string
}
