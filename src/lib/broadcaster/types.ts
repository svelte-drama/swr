import type { CacheEntry, ModelName } from '$lib/types.js'

export type Broadcaster<T> = {
  dispatch(key: string, data: CacheEntry<T>): void
  dispatchClear(): void
  dispatchClearErrors(): void
  dispatchDelete(key: string): void
  on(fn: (event: BroadcastEvent<T>) => void): () => void
  onKey(key: string, fn: (event: BroadcastEvent<T>) => void): () => void
}
export type BroadcastChannel = {
  dispatch(data: BroadcastEvent): void
  subscribe<T extends BroadcastEvent>(fn: (event: T) => void): () => void
}

export type BroadcastEvent<T = unknown> =
  | ClearEvent
  | ClearErrorEvent
  | DataEvent<T>
  | DeleteEvent
export type ClearEvent = {
  model?: ModelName
  origin: string
  type: 'clear'
}
export type ClearErrorEvent = {
  model?: ModelName
  origin: string
  type: 'clear_error'
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
