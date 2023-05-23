import { clear } from './clear.js'
export { swr } from './swr.js'
export { clear }

function pageWasReloaded() {
  if (typeof window === 'undefined') return false
  try {
    return window.performance
      .getEntriesByType('navigation')
      .map((nav) => (nav as PerformanceNavigationTiming).type)
      .includes('reload')
  } catch (e) {
    console.error(e)
    return true
  }
}

if (pageWasReloaded()) {
  clear()
}
