// The list is a virtual three-card window, not an overflow scroller. A vertical
// touch swipe uses the same single-work navigation as Previous / Next.
export function createListTouchGesture({ onStep, now = () => performance.now() }) {
  let gesture = null, suppressUntil = 0
  function finish(event, cancelled = false) {
    if (!gesture || gesture.id !== event.pointerId) return
    const current = gesture
    gesture = null
    const dx = event.clientX - current.x, dy = event.clientY - current.y
    if (current.moved || cancelled) suppressUntil = now() + 400
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (!cancelled && current.vertical && Math.abs(dy) >= 36 && Math.abs(dy) > Math.abs(dx)) onStep(dy < 0 ? 1 : -1)
  }
  return {
    onPointerDown(event) {
      if (event.pointerType !== 'touch') return
      if (!event.isPrimary) {
        const previous = gesture
        gesture = null
        if (previous && event.currentTarget.hasPointerCapture?.(previous.id)) event.currentTarget.releasePointerCapture(previous.id)
        suppressUntil = now() + 400
        return
      }
      suppressUntil = 0
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, vertical: false }
    },
    onPointerMove(event) {
      if (!gesture || gesture.id !== event.pointerId) return
      const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y)
      if (Math.hypot(dx,dy) < 8) return
      gesture.moved = true
      if (!gesture.vertical && dy > dx * 1.15) {
        gesture.vertical = true
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }
      if (gesture.vertical && event.cancelable) event.preventDefault()
    },
    onPointerUp: event => finish(event),
    onPointerCancel: event => finish(event,true),
    onLostPointerCapture: event => finish(event,true),
    onClickCapture(event) {
      if (event.detail !== 0 && now() < suppressUntil) { event.preventDefault(); event.stopPropagation() }
    },
  }
}
