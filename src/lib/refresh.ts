import { SEPARATOR } from './constants.js'

let last_refresh = 0

if (typeof window !== 'undefined') {
  init()
}

function init() {
  const key = `${SEPARATOR}refresh`
  if (pageWasReloaded()) {
    last_refresh = Date.now()
    localStorage.setItem(key, last_refresh.toString())
  } else {
    const value = localStorage.getItem(`${SEPARATOR}refresh`) ?? '0'
    last_refresh = parseInt(value, 10) || 0
  }

  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      last_refresh = parseInt(e.newValue ?? '0', 10)
    }
  })
}

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

export function getLastRefresh() {
  return last_refresh
}
