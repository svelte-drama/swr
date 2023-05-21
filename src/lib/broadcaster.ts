import { SWRBroadcastChannel } from '$lib/broadcaster/swr-broadcast-channel.js'
import { SWREventTarget } from '$lib/broadcaster/swr-event-target.js'
import type {
  DataEvent,
  DeleteEvent,
  ErrorEvent,
  Broadcaster,
  BroadcastEvent,
  ClearEvent,
} from '$lib/broadcaster/types.js'
import type { ModelName } from '$lib/types.js'
import { memoize } from '$lib/util/memoize.js'

export function Broadcaster(model_name: ModelName): Broadcaster {
  const { data_events, error_events } = createBroadcaster()

  function on<T>(fn: (event: BroadcastEvent<T>) => void) {
    const data_unsub = data_events.subscribe<BroadcastEvent<T>>((event) => {
      if (event.type === 'clear') {
        if (event.model === undefined || event.model === model_name) {
          fn(event)
        }
      } else if (model_name === event.model) {
        fn(event)
      }
    })
    const error_unsub = error_events.subscribe<ErrorEvent>((event) => {
      if (event.model === model_name) {
        fn(event)
      }
    })
    return () => {
      data_unsub()
      error_unsub()
    }
  }

  return {
    dispatch(key, data) {
      const message: DataEvent = {
        data,
        key,
        model: model_name,
        type: 'data',
      }
      data_events.dispatch(message)
    },
    dispatchClear() {
      const message: ClearEvent = {
        model: model_name,
        type: 'clear',
      }
      data_events.dispatch(message)
    },
    dispatchDelete(key) {
      const message: DeleteEvent = {
        key,
        model: model_name,
        type: 'delete',
      }
      data_events.dispatch(message)
    },
    dispatchError(key, error) {
      const message: ErrorEvent = {
        error,
        key,
        model: model_name,
        type: 'error',
      }
      error_events.dispatch(message)
    },
    on,
    onKey<T>(key: string, fn: (event: BroadcastEvent<T>) => void) {
      return on<T>(event => {
        if (event.type === 'clear' || event.key === key) {
          fn(event)
        }
      })
    },
  }
}

const createBroadcaster = memoize(() => {
  // Data events are propagated across tabs
  const data_events = SWRBroadcastChannel()
  // Error events are only emitted for the current tab
  const error_events = SWREventTarget()
  return {
    data_events,
    error_events
  }
})

export function dispatchClearAll() {
  const { data_events } = createBroadcaster()
  const event: ClearEvent = {
    type: 'clear'
  } 
  data_events.dispatch(event)
}
