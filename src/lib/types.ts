import type { Readable } from 'svelte/store'
export type { SWROptions, SWRResult } from './_functions/swr.js'

export type SWRPlugin = (arg: {
  key: string
  data: Readable<unknown>
  error: Readable<Error | undefined>
  last_update: Readable<number>
  refresh: () => void
}) => (() => void) | void
