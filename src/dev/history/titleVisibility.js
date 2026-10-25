// Use the unanimated layout rectangle, never a sticker/letter transform.
export function fullyVisible(rect, viewport) {
  return rect.width > 0 && rect.height > 0 && rect.x >= 0 && rect.y >= 0 &&
    rect.x + rect.width <= viewport.width && rect.y + rect.height <= viewport.height
}
export function nearViewport(rect, viewport, margin) {
  return rect.x + rect.width >= -margin && rect.x <= viewport.width + margin &&
    rect.y + rect.height >= 0 && rect.y <= viewport.height
}
export function createTitleGate() {
  let played = false
  return { check(rect, viewport, ready = true) {
    if (played || !ready || !fullyVisible(rect, viewport)) return false
    played = true; return true
  }, get played() { return played } }
}
