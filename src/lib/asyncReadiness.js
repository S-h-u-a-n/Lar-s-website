// A timeout is a real failure, never permission to present incomplete resources.
export function createResourceGate({ onReady, onError, abort = () => {}, timeoutMs = 60000, setTimer = setTimeout, clearTimer = clearTimeout, now = Date.now, pauseOnHidden = false, document: doc = globalThis.document }) {
  let state = 'pending'
  let remaining = timeoutMs, startedAt = 0, timer = null
  const stopTimer = () => { if (timer !== null) clearTimer(timer); timer = null }
  const removeVisibilityListener = () => { if (pauseOnHidden) doc?.removeEventListener('visibilitychange', handleVisibilityChange) }
  function armTimer() {
    if (state !== 'pending' || (pauseOnHidden && doc?.hidden)) return
    startedAt = now()
    timer = setTimer(() => fail(new Error('Required resource preparation timed out')), remaining)
  }
  function handleVisibilityChange() {
    if (state !== 'pending') return
    if (doc.hidden) {
      if (timer !== null) remaining = Math.max(0, remaining - (now() - startedAt))
      stopTimer()
    } else if (timer === null) armTimer()
  }
  if (pauseOnHidden) doc?.addEventListener('visibilitychange', handleVisibilityChange)
  armTimer()
  function fail(error) {
    if (state !== 'pending') return
    state = 'error'; stopTimer(); removeVisibilityListener(); abort(); onError(error)
  }
  return {
    get pending() { return state === 'pending' },
    complete() { if (state !== 'pending') return; state = 'ready'; stopTimer(); removeVisibilityListener(); onReady() },
    fail,
    dispose() { state = 'disposed'; stopTimer(); removeVisibilityListener(); abort() },
  }
}

// Count only an uninterrupted, visible overview; returning from a hidden tab
// starts a fresh dwell. Cancellation and completion both remove the listener.
export function waitForVisibleOverview(onExpand, { document: doc = globalThis.document, delayMs = 1250, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let timer, done = false
  function cancel() { done = true; clearTimer(timer); doc.removeEventListener('visibilitychange', arm) }
  function arm() {
    clearTimer(timer)
    if (done || doc.hidden) return
    timer = setTimer(() => { if (doc.hidden) return; cancel(); onExpand() }, delayMs)
  }
  doc.addEventListener('visibilitychange', arm); arm()
  return cancel
}
