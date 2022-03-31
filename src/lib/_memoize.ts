export function memoize<T>(fn: () => T) {
  let init = false
  let cache: T

  return () => {
    if (!init) {
      cache = fn()
      init = true
    }
    return cache
  }
}
