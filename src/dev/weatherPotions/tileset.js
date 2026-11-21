// Only this manifest knows image files. Simulation cells never store art paths.
export const TILE_GEOMETRY = {
  top: { width: 64, height: 32, anchorX: 32, anchorY: 16 },
  side: { width: 64, height: 64, anchorX: 32, anchorY: 16, repeatHeight: 16 },
}
export const TILE_URLS = {
  grass: new URL('./tileset/grass.png', import.meta.url).href,
  dryGrass: new URL('./tileset/dry-grass.png', import.meta.url).href,
  soil: new URL('./tileset/soil.png', import.meta.url).href,
  rock: new URL('./tileset/rock.png', import.meta.url).href,
  sand: new URL('./tileset/sand.png', import.meta.url).href,
  water: new URL('./tileset/water.png', import.meta.url).href,
  ice: new URL('./tileset/ice.png', import.meta.url).href,
  basalt: new URL('./tileset/basalt.png', import.meta.url).href,
  lava: new URL('./tileset/lava.png', import.meta.url).href,
  sideLeft: new URL('./tileset/side-left.png', import.meta.url).href,
  sideRight: new URL('./tileset/side-right.png', import.meta.url).href,
  snow: new URL('./tileset/snow.png', import.meta.url).href,
  wet: new URL('./tileset/wet.png', import.meta.url).href,
  foam: new URL('./tileset/foam-edge.png', import.meta.url).href,
}
export function loadTiles(onChange = () => {}) {
  const set = { images: {}, loaded: 0, total: Object.keys(TILE_URLS).length, errors: [], revision: 0 }
  let disposed = false
  for (const [id, url] of Object.entries(TILE_URLS)) {
    const image = new Image()
    image.onload = () => {
      if (disposed) return
      set.images[id] = image; set.loaded++; set.revision++
      onChange(set)
    }
    image.onerror = () => { if (!disposed) { set.errors.push(id); set.revision++; onChange(set) } }
    image.src = url
  }
  set.dispose = () => { disposed = true }
  return set
}
