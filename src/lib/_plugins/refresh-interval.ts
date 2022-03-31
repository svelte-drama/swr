import type { SWRPlugin } from '../types.js'
import { memoize } from '../_memoize'
import { derived, readable } from 'svelte/store'

const createTimer = memoize(() => {
  return readable(Date.now(), (set) => {
    const update = () => set(Date.now())
    update()
    const interval = setInterval(update, 50)
    return () => clearInterval(interval)
  })
})

const pageIsVisible = memoize(() => {
  return readable(true, (set) => {
    const update = () => set(document.visibilityState === 'visible')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  })
})

type RefreshIntervalOptions = {
  interval: number
}
export function refreshInterval({
  interval,
}: RefreshIntervalOptions): SWRPlugin {
  return ({ last_update, refresh }) => {
    const in_foreground = pageIsVisible()
    const timer = createTimer()
    const is_stale = derived(
      [in_foreground, last_update, timer],
      ([$in_foreground, $last_update, $timer]) => {
        return $in_foreground && $last_update + interval <= $timer
      }
    )
    return is_stale.subscribe(($is_stale) => {
      if ($is_stale) refresh()
    })
  }
}
