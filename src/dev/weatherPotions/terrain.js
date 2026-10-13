import { WORLD } from './config.js'

export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value))
export function grain(x, y, seed = WORLD.seed) {
  let value = Math.imul(x + seed, 374761393) + Math.imul(y + seed, 668265263)
  value = Math.imul(value ^ value >>> 13, 1274126177)
  return ((value ^ value >>> 16) >>> 0) / 4294967295
}
function smooth(x, y) {
  const a = Math.floor(x), b = Math.floor(y), u = x - a, v = y - b
  return grain(a, b) * (1 - u) * (1 - v) + grain(a + 1, b) * u * (1 - v) + grain(a, b + 1) * (1 - u) * v + grain(a + 1, b + 1) * u * v
}
export function makeTerrain() {
  const n = WORLD.size
  const cells = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = (x - n * .5) / (n * .43), v = (y - n * .48) / (n * .42)
    const radius = Math.sqrt(u * u + v * v)
    let height = 2 + Math.max(0, 1 - radius) * 27
    for (const [cx, cy, strength, size] of [[.23, .54, 29, .065], [.37, .48, 34, .06], [.50, .38, 36, .065], [.62, .34, 27, .07], [.72, .28, 14, .09], [.17, .69, 12, .065]]) {
      const dx = x / n - cx, dy = y / n - cy
      height += strength * Math.exp(-(dx * dx + dy * dy) / (size * size))
    }
    // A bay cuts into the south coast; distinct peaks leave real runoff valleys.
    height -= 12 * Math.exp(-((x / n - .32) ** 2 + (y / n - .7) ** 2) / .016)
    height += (smooth(x / 4, y / 4) - .5) * 7 + (grain(x, y) - .5) * 1.5
    height = Math.max(1, Math.round(height * 2) / 2)
    cells.push({ x, y, initial: height, height, moisture: .57 + grain(x, y) * .12, pool: 0, snow: 0, frost: 0, ice: 0, desert: 0, erosion: 0, damage: 0, lava: 0, basalt: 0, heat: 0, originalLand: height > WORLD.seaLevel + .5 })
  }
  return cells
}
export function project(x, y, height = 0) {
  return { x: WORLD.width / 2 + (x - y) * WORLD.tileWidth / 2, y: WORLD.originY + (x + y) * WORLD.tileDepth / 2 - height * WORLD.heightScale }
}
export function volumeAt(cells, level) {
  return cells.reduce((sum, cell) => sum + Math.max(0, level - cell.height), 0)
}
export function findSeaLevel(cells, volume) {
  let low = 0, high = 75
  for (let i = 0; i < 12; i++) {
    const level = (low + high) / 2
    if (volumeAt(cells, level) > volume) high = level
    else low = level
  }
  return (low + high) / 2
}
export function pickWorld(model, point) {
  for (let at = model.cells.length - 1; at >= 0; at--) {
    const c = model.cells[at]
    const p = project(c.x, c.y, Math.max(c.height + c.pool * .025, model.seaLevel))
    if (Math.abs(point.x - p.x) / (WORLD.tileWidth / 2) + Math.abs(point.y - p.y) / (WORLD.tileDepth / 2) <= 1.25) return { x: c.x, y: c.y }
  }
  const a = (point.x - WORLD.width / 2) / (WORLD.tileWidth / 2)
  const b = (point.y - WORLD.originY + model.seaLevel * WORLD.heightScale) / (WORLD.tileDepth / 2)
  const x = (a + b) / 2, y = (b - a) / 2
  if (x >= 0 && x < WORLD.size && y >= 0 && y < WORLD.size) return { x, y }
  return null
}
