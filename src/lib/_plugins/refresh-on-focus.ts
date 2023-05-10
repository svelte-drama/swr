import { derived, writable } from 'svelte/store'
import type { SWRPlugin } from '../types.js'
import { memoize } from '../_memoize.js'

const getLastFocusTimestamp = memoize(() => {
  const timestamp = writable(0)
  window.addEventListener(
    'focus',
    () => timestamp.set(Date.now()),
  )
  return timestamp
})

const getSameOriginTimestamp = memoize(() => {
  const channel = new BroadcastChannel('$$swr')
  const timestamp = writable(0)

  const dispatch = () => channel.postMessage('focus')
  if (document.hasFocus()) dispatch()
  window.addEventListener('focus', dispatch)
  channel.onmessage = () => {
    window.addEventListener(
      'focus',
      () => timestamp.set(Date.now()),
      {
        once: true,
      }
    )
  }
  return timestamp
})

type RefreshOnFocusOptions = {
  sameOrigin?: boolean
}
export function refreshOnFocus(options: RefreshOnFocusOptions = {}): SWRPlugin {
  return ({ last_update, refresh }) => {
    const timestamp = options.sameOrigin
      ? getSameOriginTimestamp()
      : getLastFocusTimestamp()
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
