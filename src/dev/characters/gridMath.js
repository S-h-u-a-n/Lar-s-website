export const modulo = (n, size) => ((n % size) + size) % size
export const characterIndex = (column, row, count) => modulo(column + row * 4, count)

export function geometry(width, height) {
  const tile = width < 600 ? 116 : 160
  const stepX = tile + (width < 600 ? 30 : 50)
  const stepY = tile + (width < 600 ? 30 : 40)
  return { tile, stepX, stepY, columns: Math.ceil(width / stepX) + 3, rows: Math.ceil(height / stepY) + 3 }
}

export function wheelPixels(event, width, height) {
  const factorX = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width : 1
  const factorY = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1
  return { x: event.deltaX * factorX, y: event.deltaY * factorY }
}

// Rebase by whole character periods: same pixels, same identities, bounded values.
export function rebase(value, step, count) {
  const period = step * count
  return modulo(value + period / 2, period) - period / 2
}
