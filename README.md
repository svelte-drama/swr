# SWR for Svelte

This is a data management/fetching library written for Svelte, inspired by [SWR](https://swr.vercel.app/), and with built in integrations for [Suspense](https://www.npmjs.com/package/@svelte-drama/suspense). By keeping all requests in cache, views can be rendered instantly while refetching any potentially stale data in the background.

[See it in action](https://pokemon-suspense-demo.vercel.app/)

## Core Functions

### swr

```js
import { swr } from '@svelte-drama/swr'

const key = '/my_url'
const options = {
  fetcher: (key) => fetch(key).then((r) => r.json()),
  maxAge: undefined,
  plugins: [],
  updater: undefined
}
const { data, error, refresh, update } = swr(key, options) // or "swr(key, options.fetcher)"
```

#### Arguments

- `key`: `string | undefined`

  A string value uniquely identifying this resource. Typically this will be the url fetched. This value will be passed to any supplied `fetcher` function.

  If `key` is `undefined`, no data will be fetched and `swr` will immediately return.

- `options.fetcher`: `async (key) => any`

  Whenever data is refreshed, this function will be called. It must return a value other than `undefined` to indicate loading was successful.

- `options.maxAge`: `number`

  If data in the cache is older than `maxAge` in milliseconds, a new request to refresh the data will be launched in the background.

- `options.plugins`: `SWRPlugin[]`

  An array of plugins to provide additional behavior. See [Plugins](https://github.com/svelte-drama/swr#plugins).

- `options.updater`: `async (key, value) => any`

  If `updater` is defined, `swr` returns a writable store for data. Any changes to that store will be immediately persisted to cache and `updater` will be called to persist this data.

#### Returns

- `data`: `Readable | Writable`

  A Svelte store containing the results returned by `fetcher`. Data is not updated if `fetcher` throws an error. A writable store is returned only if `options.updater` is defined.

- `error`: `Readable<Error | undefined>`

  A Svelte readable store containing an error if the most recent request to `fetcher` threw an error. `data` and `error` may both contain data if a request was successful and a later refresh encountered an error.

- `refresh`: `async () => void`

  Force a new request to update the cache.

- `update`: `async (callback) => ReturnValue<typeof callback>`

  Manually update the cache at this key. `callback` will be called with the current value of the cache, which may be undefined if data has not finished loading.

  This is most useful when performing optimistic updates or when receiving the results of an update from the server.

### clear

```js
import { clear } from '@svelte-drama/swr'
```

`clear()`
Deletes all items from cache.

`clear(key)`
Delete a specific key from cache.

### update

```js
import { update } from '@svelte-drama/swr'

update(key, (value) => {
  return new_value
})
```

Update the cache at a specific key. The current value will be passed to the callback, which may be `undefined` if data has not been loaded for this key yet.

Most useful when preloading data.

## Plugins

### refreshInterval

```js
import { swr } from '@svelte-drama/swr'
import { refreshInterval } from '@svelte-drama/swr/plugin'

const { data, error } = swr(key, {
  plugins: [refreshInterval({ interval })],
})
```

As long as a subscription to `data` or `error` exists, a request to refresh data will be made every `interval` in milliseconds.

### refreshOnFocus

```js
import { swr } from '@svelte-drama/swr'
import { refreshOnFocus } from '@svelte-drama/swr/plugin'

const { data, error } = swr(key, {
  plugins: [refreshOnFocus()],
})
```

As long as a subscription to `data` or `error` exists, a request to refresh data will be made whenver this window gains focus.

### refreshOnReconnect

```js
import { swr } from '@svelte-drama/swr'
import { refreshOnFocus } from '@svelte-drama/swr/plugin'

const { data, error } = swr(key, {
  plugins: [refreshOnReconnect()],
})
```

As long as a subscription to `data` or `error` exists, a request to refresh data will be made whenver the browser reconnects to the internet.

### suspend

```js
import { swr } from '@svelte-drama/swr'
import { suspend } from '@svelte-drama/swr/plugin'

const { data, error } = swr(key, {
  plugins: [suspend()],
})
```

Suspend rendering at the nearest `<Suspense>` boundary until `data` is no longer `undefined`. See [Suspense](https://github.com/svelte-drama/suspense) for more information.

`suspend` must be called during component initialization.
