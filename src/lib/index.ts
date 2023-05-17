import { clearDatabaseParition } from '$lib/cache/indexeddb-cache.js'
import { model, type ModelParams } from '$lib/model.js'
import { clearPartitionCache } from '$lib/model/internals.js'
import type { Partition } from '$lib/types.js'

export function SWR(
  options: {
    maxAge?: number
    partition?: Partition
  } = {}
) {
  const maxAge = options.maxAge ?? 0
  const partition = options.partition ?? ''

  return {
    async clear() {
      try {
        await clearDatabaseParition(partition)
      } catch (e) {
        console.error(e)
      }
      await clearPartitionCache(partition)
    },
    model<ID, MODEL>(params: ModelParams<ID, MODEL>) {
      return model(params, {
        maxAge,
        partition,
      })
    },
  }
}
