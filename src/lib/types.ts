export type Fetcher<ID, T> = (key: string, params: ID) => MaybePromise<T>
export type MaybePromise<T> = T | Promise<T>
export type ModelName = string
