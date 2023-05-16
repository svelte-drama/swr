import type { ModelVersion, Partition } from '$lib/types.js'
import type { CacheEntry } from '$lib/cache/types.js'
import { SWRBroadcastChannel } from '$lib/broadcaster/swr-broadcast-channel.js'
import { SWREventTarget } from '$lib/broadcaster/swr-event-target.js'
import type {
  BroadcastError,
  BroadcastMessage,
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
  const data_events = SWRBroadcastChannel<BroadcastMessage>(partition, version)
  // Error events are only emitted for the current tab
  const error_events = SWREventTarget<BroadcastError>()

  return {
    dispatch(key, data) {
      const message: BroadcastMessage = {
        data,
        key,
        source: SOURCE,
      }
      data_events.dispatch(message)
    },
    dispatchError(key, error) {
      const message: BroadcastError = {
        error,
        key,
        source: SOURCE,
      }
      error_events.dispatch(message)
    },
    onAllData(fn) {
      return data_events.subscribe((message) => {
        fn({
          ...message,
          foreign: message.source !== SOURCE,
        })
      })
    },
    onData<T>(key: string, fn: (data: CacheEntry<T>) => void) {
      return data_events.subscribe((message) => {
        if (key === message.key) {
          fn(message.data as CacheEntry<T>)
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
