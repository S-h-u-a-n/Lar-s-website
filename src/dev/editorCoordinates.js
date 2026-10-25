// Convert a screen drag to local CSS pixels without replacing source transforms.
export function localDragDelta(element, dx, dy) {
  let matrix = new DOMMatrix()
  for (let parent = element?.parentElement; parent; parent = parent.parentElement) {
    const css = getComputedStyle(parent)
    if (css.transform !== 'none') matrix = new DOMMatrix(css.transform).multiply(matrix)
    if (css.scale && css.scale !== 'none') {
      const [x, y = x] = css.scale.split(' ').map(Number)
      matrix = new DOMMatrix().scale(x, y).multiply(matrix)
    }
  }
  try {
    const inverse = matrix.inverse()
    return { x: inverse.a * dx + inverse.c * dy, y: inverse.b * dx + inverse.d * dy }
  } catch { return { x: dx, y: dy } }
}
export function isEditorTargetVisible(element) {
  if (!element?.isConnected || element.closest('[inert], [hidden]')) return false
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return false
  for (let node = element; node; node = node.parentElement) {
    const css = getComputedStyle(node)
    if (css.display === 'none' || css.visibility === 'hidden' || Number(css.opacity) === 0) return false
  }
  return true
}
