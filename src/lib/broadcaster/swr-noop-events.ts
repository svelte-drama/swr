import type { BroadcastChannel } from './types.js'

export const SWRNoopEvents: BroadcastChannel = {
  dispatch() {},
  subscribe() {
    return () => {}
  },
}
