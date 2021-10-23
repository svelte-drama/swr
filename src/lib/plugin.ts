import { createSuspense } from '@svelte-drama/suspense'
import type { Readable } from 'svelte/store'

export type SWRPlugin = (arg: {
  key: string
  data: Readable<unknown>
  error: Readable<Error | undefined>
  refresh: () => void
}) => (() => void) | void

type RefreshIntervalOptions = {
  interval: number
}
export function refreshInterval({
  interval,
}: RefreshIntervalOptions): SWRPlugin {
  return ({ refresh }) => {
    const timer = setInterval(refresh, interval)
    return () => clearInterval(timer)
  }
}

export function refreshOnFocus(): SWRPlugin {
  return ({ refresh }) => {
    const handler = () => refresh()
    window.addEventListener('focus', handler)
    return () => window.removeEventListener('focus', handler)
  }
}

export function refreshOnReconnect(): SWRPlugin {
  return ({ refresh }) => {
    const handler = () => refresh()
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
  }
}

export function suspend(): SWRPlugin {
  const suspend = createSuspense()
  return ({ data, error }) => {
    suspend(data, error)
  }
}
