// Preserve the caller's frame cadence, but do no work in a hidden document.
export function createVisibleFrameLoop(draw, { doc = document, raf = requestAnimationFrame, cancel = cancelAnimationFrame, onResume = () => {} } = {}) {
  let frame = null, requested = false, disposed = false
  const tick = time => {
    frame = null
    if (disposed || doc.hidden) return
    requested = false
    draw(time)
  }
  function request() {
    if (disposed) return
    requested = true
    if (!doc.hidden && frame === null) frame = raf(tick)
  }
  function visibility() {
    if (doc.hidden) {
      if (frame !== null) cancel(frame)
      frame = null
    } else if (requested) {
      onResume()
      request()
    }
  }
  doc.addEventListener('visibilitychange', visibility)
  return { request, dispose() {
    disposed = true; requested = false
    if (frame !== null) cancel(frame)
    frame = null
    doc.removeEventListener('visibilitychange', visibility)
  } }
}

// Coalesce visual coordinates only; never discard simulation brush samples.
export function createFrameBatch(write, { raf = requestAnimationFrame, cancel = cancelAnimationFrame } = {}) {
  let frame = null, value, version = 0
  function clearPending() {
    version++
    if (frame !== null) cancel(frame)
    frame = null
    value = undefined
  }
  return {
    push(next) {
      value = next
      if (frame !== null) return
      const current = version
      frame = raf(() => {
        if (current !== version) return
        frame = null
        const next = value; value = undefined
        write(next)
      })
    },
    flush(next) { clearPending(); write(next) },
    cancel: clearPending,
  }
}
