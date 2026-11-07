// Measure content in world coordinates, independent of the current camera and
// arrival transforms. Decorative background circles do not determine the fit.
export function measureCategoryBounds(viewport, category) {
  const section = viewport?.querySelector(`[data-research-category="${category.id}"]`)
  if (!section) return { x: category.x, y: category.y, width: category.width, height: category.height }
  const boxes = []
  const add = (node, x = node.offsetLeft, y = node.offsetTop) => {
    boxes.push({ x, y, right: x + node.offsetWidth, bottom: y + node.offsetHeight })
  }
  for (const node of section.children) {
    if (node.matches('.nt-category-title,.nt-category-intro,.nt-entry,.nt-category-number,.ht-landmark')) add(node)
  }
  const title = section.querySelector('.nt-category-title')
  const art = title?.querySelector('.nt-decoration')
  if (art) {
    // Offset chains account for the existing zero-size corner anchor.
    let x = 0, y = 0, node = art
    while (node && node !== section) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent }
    add(art, x, y)
  }
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y))
  return { x: category.x + x, y: category.y + y, width: Math.max(...boxes.map(b => b.right)) - x, height: Math.max(...boxes.map(b => b.bottom)) - y }
}

export function fittedView(bounds, size, padding = 30, maxScale = Infinity) {
  const scale = Math.min(maxScale, (size.width - padding * 2) / bounds.width, (size.height - padding * 2) / bounds.height)
  return { point: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }, scale }
}
