// Only authored fields are overrides. Exported dimensions without changedFields
// are legacy sparse patches; an explicit empty list is a measurement snapshot.
export const LAYOUT_FIELDS = ['x', 'y', 'width', 'height', 'rotation', 'zIndex']
export const COMPONENT_LAYOUT_SELECTOR = '[data-layout-owned="component"]'

export function layoutOverrides(record) {
  const fields = Array.isArray(record?.changedFields) ? record.changedFields : LAYOUT_FIELDS
  return Object.fromEntries(LAYOUT_FIELDS.filter(field => fields.includes(field) && Number.isFinite(record?.[field])).map(field => [field, record[field]]))
}

export function layoutItem(defaults, published, draft) {
  const overrides = { ...layoutOverrides(published), ...layoutOverrides(draft) }
  return { ...defaults, ...overrides, layoutOverrides: overrides }
}

// Apply explicit intent, not a comparison with our own previous DOM writes.
export function layoutStyles(item) {
  const fields = item.layoutOverrides ?? {}
  const styles = {}
  if ('x' in fields || 'y' in fields) styles.translate = `${item.x}px ${item.y}px`
  if ('rotation' in fields) styles.rotate = `${item.rotation}deg`
  if ('width' in fields) styles.width = `${item.width}px`
  if ('height' in fields) styles.height = `${item.height}px`
  if ('zIndex' in fields) styles.zIndex = item.zIndex
  return styles
}

export function localSize(element, field, computed = getComputedStyle(element)) {
  // Hidden percentage-sized images report "100%", not 100 CSS pixels.
  const value = computed[field]
  if (/^\d+(?:\.\d+)?px$/.test(value)) return Number.parseFloat(value)
  return element[field === 'width' ? 'offsetWidth' : 'offsetHeight'] || element.getBoundingClientRect()[field] || 0
}
