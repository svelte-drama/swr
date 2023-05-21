import type { BroadcastChannel } from './types.js'

export function SWREventTarget(): BroadcastChannel {
  const events = new EventTarget()

  return {
    dispatch(data) {
      const event = new CustomEvent('message', { detail: data })
      events.dispatchEvent(event)
    },
    subscribe<T>(fn: (event: T) => void) {
      const listener = ((e: CustomEvent<T>) => {
        fn(e.detail)
      }) as EventListener
      events.addEventListener('message', listener)
      return () => events.removeEventListener('message', listener)
    },
  }
}
