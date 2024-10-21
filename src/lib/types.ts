import type { Readable } from 'svelte/store'

export type Fetcher<ID, T> = (key: string, params: ID) => MaybePromise<T>
export type MaybePromise<T> = T | Promise<T>
export type ModelName = string

export interface SWRModel<T> extends Promise<T>, Readable<T | undefined> {
  error: Error | undefined
  value: T | undefined
}
