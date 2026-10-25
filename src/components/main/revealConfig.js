// All durations are milliseconds. Face coordinates refer to the original JPEG.
export const MAIN_REVEAL = {
  baseColor: '#A2D8DE', activeColor: '#55c0d7', hoverColor: '#F691A6', gapColor: '#FDF9EE',
  cornerRadiusRatio: .22, tileGap: 3, seamOverlap: .25,
  tileSize: { min: 88, viewportRatio: .09, max: 126, facePadding: 1.04 },
  palette: [
    { colors: ['#E6F5F3', '#E7F1FC', '#EDF7F8', '#F9F5CC'], weight: .45 },
    { colors: ['#A2D8DE', '#BFE0F5', '#FFDBCA'], weight: .35 },
    { colors: ['#7FB9EC', '#F691A6', '#E5DDF5'], weight: .20 },
  ],
  face: { center: { x: .70, y: .405 }, clip: { x: .65, y: .32, width: .10, height: .17 } },
  manualRevealCount: 5,
  // First point is always the face cell. Others are relative to the visible mask.
  interactionPositions: [null, { x: .83, y: .62 }, { x: .55, y: .78 }, { x: .28, y: .55 }, { x: .52, y: .30 }],
  hoverDuration: 300, hoverReverseDuration: 220, singleFlipDuration: 400, main1Duration: 1000,
  finalRevealDelay: 180, finalWaveDuration: 1500,
  flipAngle: 90, preparationAngle: 6, preparationRatio: .16,
  waveDelayVariation: 30, flipAngleVariation: 8,
  wave: { tileDuration: 440, fadeStart: .64, shrinkStart: .76, endScale: .16, perspective: 1100 },
  layer: { zIndex: 1000 },
}
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value))
export const tileId = (column, row) => `${column}:${row}`
export function hash(key, seed = 0) {
  let value = seed >>> 0
  for (let i = 0; i < key.length; i += 1) value = Math.imul(value ^ key.charCodeAt(i), 16777619) >>> 0
  value ^= value >>> 16; value = Math.imul(value, 0x7feb352d); value ^= value >>> 15
  return (value >>> 0) / 4294967296
}
export function tileColor(column, row, seed, cache, assignedGroup) {
  const id = tileId(column, row)
  if (cache.has(id)) return cache.get(id)
  const draw = hash(`${id}:group`, seed)
  let cumulative = 0
  const group = assignedGroup || MAIN_REVEAL.palette.find(group => { cumulative += group.weight; return draw < cumulative }) || MAIN_REVEAL.palette[2]
  const neighbors = [cache.get(tileId(column - 1, row)), cache.get(tileId(column, row - 1)), cache.get(tileId(column + 1, row)), cache.get(tileId(column, row + 1))]
  const choices = group.colors.filter(color => !neighbors.includes(color))
  const pool = choices.length ? choices : group.colors
  const color = pool[Math.floor(hash(`${id}:color`, seed) * pool.length)]
  cache.set(id, color)
  return color
}
export function layoutTiles(width, height, face, seed, cache) {
  // A slightly larger face cell is allowed when the rendered difference exceeds
  // the reference tile size; the entire lattice still consists of equal squares.
  const size = Math.max(clamp(width * MAIN_REVEAL.tileSize.viewportRatio, MAIN_REVEAL.tileSize.min, MAIN_REVEAL.tileSize.max), Math.max(face.width, face.height) * MAIN_REVEAL.tileSize.facePadding)
  const originX = face.x - size / 2, originY = face.y - size / 2
  const left = Math.floor(-originX / size), right = Math.ceil((width - originX) / size)
  const top = Math.floor(-originY / size), bottom = Math.ceil((height - originY) / size)
  const assignments = new Map()
  if (cache.size === 0) {
    const ids = []
    for (let row = top; row < bottom; row += 1) for (let column = left; column < right; column += 1) ids.push(tileId(column, row))
    ids.sort((a, b) => hash(`${a}:order`, seed) - hash(`${b}:order`, seed))
    const lightCount = Math.round(ids.length * MAIN_REVEAL.palette[0].weight)
    const middleCount = Math.round(ids.length * MAIN_REVEAL.palette[1].weight)
    ids.forEach((id, index) => assignments.set(id, MAIN_REVEAL.palette[index < lightCount ? 0 : index < lightCount + middleCount ? 1 : 2]))
  }
  const tiles = []
  for (let row = top; row < bottom; row += 1) for (let column = left; column < right; column += 1) {
    tiles.push({ id: tileId(column, row), column, row, x: originX + column * size, y: originY + row * size, size, color: tileColor(column, row, seed, cache, assignments.get(tileId(column, row))) })
  }
  return { tiles, size }
}
export function selectTarget(geometry, step, removed) {
  if (step >= MAIN_REVEAL.manualRevealCount) return null
  if (step === 0) return tileId(0, 0)
  const point = MAIN_REVEAL.interactionPositions[step]
  // Only fully visible cells are chosen for later interactions where possible.
  const available = geometry.tiles.filter(tile => !removed.includes(tile.id))
  const inside = available.filter(tile => tile.x >= 0 && tile.y >= 0 && tile.x + tile.size <= geometry.width && tile.y + tile.size <= geometry.height)
  const candidates = inside.length ? inside : available
  return candidates.reduce((best, tile) => {
    const distance = Math.hypot((tile.x + tile.size / 2) / geometry.width - point.x, (tile.y + tile.size / 2) / geometry.height - point.y)
    return !best || distance < best.distance ? { id: tile.id, distance } : best
  }, null)?.id
}
export function measureArtworkFace(image, top) {
  const wrapper = image.closest('[data-layout-id="main-artwork"]')
  const rect = (image.offsetHeight ? image : wrapper).getBoundingClientRect()
  const transform = getComputedStyle(wrapper).transform
  const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform)
  const width = image.offsetWidth || wrapper.clientWidth
  const height = image.offsetHeight || width / (8994 / 4048)
  const point = (x, y) => ({
    x: rect.left + rect.width / 2 + matrix.a * (x - .5) * width + matrix.c * (y - .5) * height,
    y: rect.top + rect.height / 2 + matrix.b * (x - .5) * width + matrix.d * (y - .5) * height - top,
  })
  const center = point(MAIN_REVEAL.face.center.x, MAIN_REVEAL.face.center.y)
  const clip = MAIN_REVEAL.face.clip
  const corners = [point(clip.x, clip.y), point(clip.x + clip.width, clip.y), point(clip.x, clip.y + clip.height), point(clip.x + clip.width, clip.y + clip.height)]
  return { ...center, width: Math.max(...corners.map(p => p.x)) - Math.min(...corners.map(p => p.x)), height: Math.max(...corners.map(p => p.y)) - Math.min(...corners.map(p => p.y)) }
}
