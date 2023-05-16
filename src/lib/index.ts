import { model, type ModelParams } from '$lib/model.js'
import type { CreateSuspenseFn, Partition } from '$lib/types.js'

type SWRParams = {
  maxAge?: number
  partition?: Partition
  suspense?: CreateSuspenseFn
}
export function SWR({ maxAge, partition, suspense }: SWRParams = {}) {
  return function <ID, T>(params: ModelParams<ID, T>) {
    return model(params, {
      maxAge: maxAge ?? 0,
      partition: partition ?? '',
      suspense,
    })
  }
}
