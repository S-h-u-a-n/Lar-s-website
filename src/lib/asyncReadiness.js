// A timeout is a real failure, never permission to present incomplete resources.
export function createResourceGate({ onReady, onError, abort = () => {}, timeoutMs = 60000, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let state = 'pending'
  const timer = setTimer(() => fail(new Error('Required resource preparation timed out')), timeoutMs)
  function fail(error) {
    if (state !== 'pending') return
    state = 'error'; clearTimer(timer); abort(); onError(error)
  }
  return {
    get pending() { return state === 'pending' },
    complete() { if (state !== 'pending') return; state = 'ready'; clearTimer(timer); onReady() },
    fail,
    dispose() { state = 'disposed'; clearTimer(timer); abort() },
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
