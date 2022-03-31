import { derived, writable } from 'svelte/store'
import type { SWRPlugin } from '$lib/types.js'
import { memoize } from '$lib/_memoize.js'

const getLastOnlineTimestamp = memoize(() => {
  const timestamp = writable(0)
  window.addEventListener('online', () => {
    timestamp.set(Date.now())
  })
  return timestamp
})

export function refreshOnReconnect(): SWRPlugin {
  return ({ last_update, refresh }) => {
    const timestamp = getLastOnlineTimestamp()
    const is_stale = derived(
      [last_update, timestamp],
      ([$last_update, $timestamp]) => {
        return $last_update < $timestamp
      }
    )

    return is_stale.subscribe(($is_stale) => {
      if ($is_stale) refresh()
    })
  }
}
