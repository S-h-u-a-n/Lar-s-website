export function finishComicSequence({
  finishedRef,
  busyRef,
  requestFrameRef,
  timersRef,
  cancelFrame,
  clearTimer,
}) {
  if (finishedRef.current) return false
  finishedRef.current = true
  if (requestFrameRef.current !== null) {
    cancelFrame(requestFrameRef.current)
    requestFrameRef.current = null
  }
  timersRef.current.forEach(clearTimer)
  timersRef.current.clear()
  busyRef.current = true
  return true
}
