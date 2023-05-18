import type { ModelVersion, Partition } from '$lib/types.js'
import type { CacheEntry } from '$lib/cache/types.js'
import { SWRBroadcastChannel } from '$lib/broadcaster/swr-broadcast-channel.js'
import { SWREventTarget } from '$lib/broadcaster/swr-event-target.js'
import type {
  BroadcastData,
  BroadcastDelete,
  BroadcastError,
  Broadcaster,
} from '$lib/broadcaster/types.js'

const SOURCE = (() => {
  try {
    return crypto.randomUUID()
  } catch {
    //
    return ''
  }
})()

export function Broadcaster(
  partition: Partition,
  version: ModelVersion
): Broadcaster {
  // Data events are propagated across tabs
  const data_events = SWRBroadcastChannel<BroadcastDelete | BroadcastData>(partition, version)
  // Error events are only emitted for the current tab
  const error_events = SWREventTarget<BroadcastError>()

  return {
    dispatch(key, data) {
      const message: BroadcastData = {
        data,
        key,
        type: 'data',
        source: SOURCE,
      }
      data_events.dispatch(message)
    },
    dispatchDelete(key) {
      const message: BroadcastDelete = {
        key,
        source: SOURCE,
        type: 'delete',
      }
      data_events.dispatch(message)
    },
    dispatchError(key, error) {
      const message: BroadcastError = {
        error,
        key,
        source: SOURCE,
        type: 'error'
      }
      error_events.dispatch(message)
    },
    onAllData(fn) {
      return data_events.subscribe((message) => {
        fn(message, message.source !== SOURCE)
      })
    },
    onData<T>(key: string, fn: (data: CacheEntry<T>) => void) {
      return data_events.subscribe((message) => {
        if (message.type === 'data' && key === message.key) {
          fn(message.data as CacheEntry<T>)
        }
      })
    },
    onDelete(key: string, fn: () => void) {
      return data_events.subscribe(message => {
        if (message.type === 'delete' && key === message.key) {
          fn()
        }
      })
    },
    onError(key, fn) {
      return error_events.subscribe((message) => {
        if (key === message.key) {
          fn(message.error)
        }
      })
    },
  }
}
