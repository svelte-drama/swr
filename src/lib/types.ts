import type { Readable } from 'svelte/store'

export type CreateSuspenseFn = () => <T>(
  data: Readable<T | undefined>,
  error: Readable<unknown>
) => Readable<T | undefined>
export type Fetcher<ID, T> = (key: string, params: ID) => MaybePromise<T>
export type MaybePromise<T> = T | Promise<T>
export type ModelVersion = string
export type Partition = string
