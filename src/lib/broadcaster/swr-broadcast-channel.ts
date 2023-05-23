import { SEPARATOR, SWR_VERSION } from '$lib/constants.js'
import type { BroadcastChannel } from './types.js'

export function SWRBroadcastChannel<T>(): BroadcastChannel {
  const channel_name = `swr${SEPARATOR}${SWR_VERSION}`
  const receiver = new BroadcastChannel(channel_name)
  const sender = new BroadcastChannel(channel_name)
  return {
    dispatch(data) {
      sender.postMessage(data)
    },
    subscribe(fn) {
      const listener = (e: MessageEvent) => {
        fn(e.data)
      }
      receiver.addEventListener('message', listener)
      return () => receiver.removeEventListener('message', listener)
    },
  }
}
