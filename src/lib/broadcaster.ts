import { SWRBroadcastChannel } from '$lib/broadcaster/swr-broadcast-channel.js'
import { SWREventTarget } from '$lib/broadcaster/swr-event-target.js'
import { SWRNoopEvents } from '$lib/broadcaster/swr-noop-events.js'
import type {
  DataEvent,
  DeleteEvent,
  Broadcaster,
  BroadcastEvent,
  ClearEvent,
} from '$lib/broadcaster/types.js'
import type { ModelName } from '$lib/types.js'
import { memoize } from '$lib/util/memoize.js'

const ORIGIN = `${Math.random().toString(36).substring(2, 11)}::${Date.now()}`

export function Broadcaster(model_name: ModelName): Broadcaster {
  const broadcaster = createBroadcaster()

  function on<T>(fn: (event: BroadcastEvent<T>) => void) {
    return broadcaster.subscribe<BroadcastEvent<T>>((event) => {
      if (event.type === 'clear') {
        if (event.model === undefined || event.model === model_name) {
          fn(event)
        }
      } else if (model_name === event.model) {
        fn(event)
      }
    })
  }

  return {
    dispatch(key, data) {
      const message: DataEvent = {
        data,
        key,
        model: model_name,
        origin: ORIGIN,
        type: 'data',
      }
      broadcaster.dispatch(message)
    },
    dispatchClear() {
      const message: ClearEvent = {
        model: model_name,
        origin: ORIGIN,
        type: 'clear',
      }
      broadcaster.dispatch(message)
    },
    dispatchDelete(key) {
      const message: DeleteEvent = {
        key,
        model: model_name,
        origin: ORIGIN,
        type: 'delete',
      }
      broadcaster.dispatch(message)
    },
    on,
    onKey<T>(key: string, fn: (event: BroadcastEvent<T>) => void) {
      return on<T>((event) => {
        if (event.type === 'clear' || event.key === key) {
          fn(event)
        }
      })
    },
  }
}

const createBroadcaster = memoize(() => {
  if (typeof window === 'undefined') {
    return SWRNoopEvents
  }
  if (
    typeof BroadcastChannel === 'undefined' ||
    typeof navigator.locks === 'undefined'
  ) {
    return SWREventTarget()
  }
  return SWRBroadcastChannel()
})

export function dispatchClearAll() {
  const broadcaster = createBroadcaster()
  const event: ClearEvent = {
    origin: ORIGIN,
    type: 'clear',
  }
  broadcaster.dispatch(event)
}

export function isEventSameOrigin(event: BroadcastEvent) {
  return event.origin === ORIGIN
}
