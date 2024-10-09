# @svelte-suspense/swr

This is a data management/fetching library written for Svelte, inspired by [SWR](https://swr.vercel.app/), and with built in integrations for Suspense. By keeping all requests in cache, views can be rendered instantly while refetching any potentially stale data in the background.

[See it in action](https://pokemon-suspense-demo.vercel.app/)

## Installation

```bash
npm install --save @svelte-suspense/swr
```

## Requirements

SWR requires [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) and [LockManager](https://developer.mozilla.org/en-US/docs/Web/API/LockManager).

Full support for those interfaces is included natively in:

- Chrome 69
- Edge 79
- FireFox 96
- Opera 56
- Safari 15.4

## Usage

### swr

```ts
import { swr } from '@svelte-drama/swr'

const model = swr<ID, MODEL>({
  key(id: ID) {
    return `/api/endpoint/${id}`
  },
  async fetcher(key: string, id: ID) {
    const request = fetch(key)
    return request.json() as MODEL
  },
})
```

`ID` may be of type `any`. `MODEL` must be an object that can be cloned via the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types).

#### Options

- `key(id: ID) => string`

  A function to create a unique cache when given the user defined `id`. Typically, this is the API path this data would be fetched from.

- `fetcher(key: string, id: ID) => MaybePromise<MODEL>`

  A function to retrieve data from the server. It is passed `key`, the result of the `key` function and the same `id` passed to the `key` function.

- `maxAge?: number = 0`

  Only use cached values that are no older than `maxAge` in milliseconds.

- `name?: string = ''`

  Segment the cache using this as a key. Models with the same name share the same cache, so key collision must be kept in mind.

#### Methods

The returned object `model` has several functions for fetching data.

- `model.clear() => Promise<void>`

  Clear all data from this cache. Note: Models with the same name share a cache.

- `model.delete(id: ID) => Promise<void>`

  Delete item from cache.

- `model.get(id: ID) => Promise<MODEL>`

  Returns data from cache if less than `maxAge` or performs a request using the provided `fetcher`

- `model.keys() => Promise<string[]>`

  Returns all currently cached keys, regardless of age.

- `model.refresh(id: ID) => Promise<MODEL>`

  Performs a request using the provided `fetcher`. Always makes a request, regradless of current cache status.

- `model.update(id: ID, data: MODEL) => Promise<MODEL>`  
  `model.update(id: ID, fn: (data: MODEL) => MaybePromise<MODEL>) => Promise<MODEL>`

  Update data in the cache.

### clear

```ts
import { clear } from '@svelte-drama/swr'

clear()
```

Remove all data from all caches.
