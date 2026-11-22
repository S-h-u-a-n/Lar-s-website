// Require a full idle gap after arrival, a dwell and a fresh signed gesture budget.
export function createEntryGesture(config) {
  let lastWheel = -Infinity, arrived = null, candidate = null, total = 0, triggered = false
  return {
    arrive(time) { if (arrived === null) { arrived = time; candidate = null; total = 0 } },
    leave() { arrived = null; candidate = null; total = 0 },
    input(time, towardEnd, pixels) {
      const gap = time - lastWheel
      lastWheel = time
      if (triggered || arrived === null || !towardEnd) { candidate = null; total = 0; return false }
      if (gap >= config.quietMs && time - arrived >= config.dwellMs) { candidate = time; total = 0 }
      if (candidate === null || time - candidate > config.gestureWindowMs) { candidate = null; return false }
      total += Math.abs(pixels)
      if (total < config.thresholdPx) return false
      triggered = true; return true
    },
    get triggered() { return triggered },
  }
}
