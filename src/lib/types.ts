import type { Readable } from 'svelte/store'

export type SuspenseFn = <T>(
  data: Readable<T | undefined>,
  error?: Readable<Error | undefined>,
) => Readable<T | undefined>
export type Fetcher<ID, T> = (key: string, params: ID) => MaybePromise<T>
export type MaybePromise<T> = T | Promise<T>
export type ModelName = string
