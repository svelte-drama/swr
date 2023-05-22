export function getOrSet<K, V>(map: Map<K, V>, key: K, fn: () => V) {
  if (map.has(key)) {
    return map.get(key)!
  }
  const value = fn()
  map.set(key, value)
  return value
}
