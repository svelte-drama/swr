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
  updater: undefined,
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

  If data in the cache is older than `maxAge` in milliseconds, a new request to refresh the data will be launched in the background. This check only occurs during initializtion. To do continous polling, see [refreshInterval](https://github.com/svelte-drama/swr#refreshInterval).

- `options.plugins`: `SWRPlugin[]`

  An array of plugins to provide additional behavior. See [Plugins](https://github.com/svelte-drama/swr#plugins).

- `options.updater`: `async (key, value) => any`

  If `updater` is defined, `swr` returns a writable store for data. Any changes to that store will be immediately persisted to cache and `updater` will be called to persist this data.

#### Returns

- `data`: `Readable | Writable`

  A Svelte store containing the results returned by `fetcher`. Data is not updated if `fetcher` throws an error. A writable store is returned only if `options.updater` is defined.

- `error`: `Readable<Error | undefined>`

  A Svelte readable store containing an error if the most recent request to `fetcher` threw an error. `data` and `error` may both contain data if a request was successful and a later refresh encountered an error.

- `fetch`: `Promise`

  Returns data from the most recent request, or issues a new request if none has been cached.

- `processing`: `Readable<boolean>`

  A Svelte readable store indicating if is a request is currently in progress. Useful for showing background activity indicators.

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
```

Update the cache at a specific key. Most useful when preloading data or when data needs to be reloaded from the server.

```js
update(key)
```

Mark data as stale, triggering any relevant fetcher functions fetch new data.

```js
update(key, new_value)
```

Set the cached value.

```js
update(key, async (value) => {
  return new_value
})
```

The current value will be passed to the callback, which may be `undefined` if data has not been loaded for this key yet.

## Plugins

### refreshInterval

```js
import { swr } from '@svelte-drama/swr'
import { refreshInterval } from '@svelte-drama/swr/plugin'

const { data, error } = swr(key, {
  plugins: [refreshInterval({ interval })],
})
```

While a subscription to `data` or `error` exists, a request to refresh data will be made if data was last updated at least `interval` milliseconds ago and the current page is visible to the user.

### refreshOnFocus

```js
import { swr } from '@svelte-drama/swr'
import { refreshOnFocus } from '@svelte-drama/swr/plugin'

const { data, error } = swr(key, {
  plugins: [refreshOnFocus()],
})

const { data, error } = swr(key, {
  plugins: [refreshOnFocus({ sameOrigin: true })],
})
```

Treat data as stale if it was last updated prior to the most recent time this window gained focus.  If `sameOrigin` is set, data will be refreshed only if another tab running on the same origin was visited since the last time data was fetched.

### refreshOnReconnect

```js
import { swr } from '@svelte-drama/swr'
import { refreshOnReconnect } from '@svelte-drama/swr/plugin'

const { data, error } = swr(key, {
  plugins: [refreshOnReconnect()],
})
```

Treat data as stale if it was last updated prior to the most recent ["online" event](https://developer.mozilla.org/en-US/docs/Web/API/Window/online_event).

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
