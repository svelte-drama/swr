export function memoize<F extends () => unknown>(func: F) {
  let cache: ReturnType<F>

  return function () {
    if (cache !== undefined) {
      return cache
    }

    cache = func() as ReturnType<F>
    return cache
  }
}
