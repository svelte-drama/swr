import { createSuspense } from '@svelte-drama/suspense'
import type { SWRPlugin } from '$lib/types.js'

export function suspend(): SWRPlugin {
  const suspend = createSuspense()
  return ({ data, error }) => {
    suspend(data, error)
  }
}
