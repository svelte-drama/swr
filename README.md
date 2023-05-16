# @svelte-suspense/swr

This is a data management/fetching library written for Svelte, inspired by [SWR](https://swr.vercel.app/), and with built in integrations for Suspense. By keeping all requests in cache, views can be rendered instantly while refetching any potentially stale data in the background.

## Installation

```bash
npm install --save @svelte-suspense/swr
```

## Usage

### SWR

```ts
import { SWR } from '@svelte-drama/swr

const createModel = SWR(options?)
```

Creates a new SWR instance. Returns a function to create individual models.

#### Options

- `maxAge?: number`

  The default maximum age in milliseconds for cached data. This can be overridden on a per model basis. The default is `0` which will cause all requests to revalidate data with the server. It is highly recommended to pick a maximum age for data that suits the needs of your application.

- `partition?: string`

  The partition key for cache segregation. Typically, this would be a user id so that data for different users is stored in different caches.

- `suspend: createSuspense`

  If integration with [@svelte-drama/suspense](https://www.npmjs.com/package/@svelte-drama/suspense) is desired, pass `createSuspense` from that package here. All calls to `model.live()` will automatically call `createSuspense`.

### Model

```ts
const model = createModel<ID, MODEL>({
  key(id: ID) {
    return `/api/endpoint/${id}`
  },
  async fetcher(key: string, id: ID) {
    const request = fetch(key)
    return request.json() as MODEL
  },
})
```

#### Options

- `key(id: ID) => string`

  A function to create a unique cache when given the user defined `id`. Typically, this is the API path this data would be fetched from.

- `fetcher(key: string, id: ID) => MaybePromise<MODEL>`

  A function to retrieve data from the server. It is passed `key`, the result of the `key` function and the same `id` passed to the `key` function.

- `maxAge?: number`

  If the last cached value is older than `maxAge` in milliseconds, it will be refetched from the server in the background. Defaults to the `maxAge` value passed to `SWR`.

- `version?: string`

  Used to segment the cache, preventing saved data from previous schemas being used. Typically, this would be a date (`2023-05-15`) when the model schema was last updated.

#### Methods

The returned object `model` has several functions for fetching data.

- `model.fetch(id: ID) => Promise<MODEL>`

  Returns data from cache if less than `maxAge` or performs a request using the provided `fetcher`

- `model.live(id: ID) => Readable<MODEL | undefined>`

  Returns a Svelte store that tracks the currently cached data. If no information is in the cache, the store will have the value `undefined` while data is requested. If the data in the cache is older than `maxAge`, a request to update data will be performed in the background and the store will automatically update.

- `model.refresh(id: ID) => Promise<MODEL>`

  Performs a request using the provided `fetcher`. Always makes a request, regradless of current cache status.

- `model.update(id: ID, data: MODEL) => Promise<MODEL>`  
  `model.update(id: ID, fn: (data: MODEL) => MaybePromise<MODEL>) => Promise<MODEL>`

  Update data in the cache.

## TODO

- Ability to clear cache data from a partition
