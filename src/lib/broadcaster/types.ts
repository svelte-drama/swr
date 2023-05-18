import type { CacheEntry } from '$lib/cache/types.js'

export type Broadcaster = {
  dispatch(key: string, data: CacheEntry): void
  dispatchDelete(key: string): void
  dispatchError(key: string, error: unknown): void
  onAllData(
    fn: (message: (BroadcastData | BroadcastDelete), foreign: boolean) => void
  ): () => void
  onData<T>(key: string, fn: (data: CacheEntry<T>) => void): () => void
  onDelete(key: string, fn: () => void): () => void
  onError(key: string, fn: (error: unknown) => void): () => void
}
export type BroadcastChannel<T> = {
  dispatch: (data: T) => void
  subscribe: (fn: (data: T) => void) => () => void
}

export type BroadcastMessage = {
  key: string
  source: string
}
export type BroadcastData<T = unknown> = BroadcastMessage & {
  data: CacheEntry<T>
  type: 'data'
}
export type BroadcastDelete = BroadcastMessage & {
  type: 'delete'
}
export type BroadcastError = BroadcastMessage & {
  error: unknown
  type: 'error'
}
