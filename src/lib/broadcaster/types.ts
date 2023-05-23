import type { CacheEntry } from '$lib/cache/types.js'
import type { ModelName } from '$lib/types.js'

export type Broadcaster = {
  dispatch(key: string, data: CacheEntry): void
  dispatchClear(): void
  dispatchDelete(key: string): void
  on<T>(fn: (event: BroadcastEvent<T>) => void): () => void
  onKey<T>(key: string, fn: (event: BroadcastEvent<T>) => void): () => void
}
export type BroadcastChannel = {
  dispatch(data: BroadcastEvent): void
  subscribe<T extends BroadcastEvent>(fn: (event: T) => void): () => void
}

export type BroadcastEvent<T = unknown> =
  | ClearEvent
  | DataEvent<T>
  | DeleteEvent
export type ClearEvent = {
  model?: ModelName
  origin: string
  type: 'clear'
}
export type DataEvent<T = unknown> = {
  data: CacheEntry<T>
  key: string
  model: ModelName
  origin: string
  type: 'data'
}
export type DeleteEvent = {
  key: string
  model: ModelName
  origin: string
  type: 'delete'
}
