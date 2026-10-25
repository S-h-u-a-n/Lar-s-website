import { MATERIAL as M, WORLD } from './config.js'
export const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value))
export function grain(x, y, seed = WORLD.seed) {
  let h = Math.imul(x + seed, 374761393) + Math.imul(y + seed, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
// Side-on mountains, a rain-catching valley, a low peninsula and a deep bay.
export function makeTerrain(world) {
  const { columns: w, rows: h } = world
  const sea = Math.round(h * WORLD.seaY)
  let water = 0, fragile = 0, land = 0
  for (let x = 0; x < w; x++) {
    const u = x / (w - 1)
    let level = .85 - .47 * Math.exp(-(((u - .19) / .11) ** 2))
      - .32 * Math.exp(-(((u - .38) / .10) ** 2))
      - .16 * Math.exp(-(((u - .56) / .08) ** 2))
    level += Math.sin(u * 27) * .012 + Math.sin(u * 79) * .004
    const top = clamp(Math.round(level * h), 4, h - 7)
    world.initialSurface[x] = top
    if (top < sea - 2) { world.dryColumns[x] = 1; land++ }
    for (let y = 0; y < h; y++) {
      const i = y * w + x
      world.tint[i] = Math.floor(grain(x, y) * 255)
      world.temperatureGrid[i] = 18
      if (y >= top) {
        const soil = y - top < Math.max(3, Math.round(h * .045))
        world.material[i] = soil ? M.SOIL : M.ROCK
        world.origin[i] = soil ? 1 : 2
        world.moisture[i] = soil ? .62 : .12
        if (!soil && y < sea + h * .1) fragile++
      } else if (y >= sea) { world.material[i] = M.WATER; water++ }
    }
  }
  // A few actual cloud cells; these can drift, rain and join the water cycle.
  for(const [cx,cy,rx,ry] of [[.23,.14,.045,.015],[.54,.18,.04,.014],[.80,.12,.055,.018]]) {
    for(let y=Math.floor((cy-ry)*h);y<=(cy+ry)*h;y++)for(let x=Math.floor((cx-rx)*w);x<=(cx+rx)*w;x++) {
      if(((x/w-cx)/rx)**2+((y/h-cy)/ry)**2>1)continue
      const i=y*w+x
      if(world.material[i]===M.AIR)world.material[i]=M.CLOUD
    }
  }
  world.initialWater = water
  world.initialFragile = Math.max(1, fragile)
  world.initialLandColumns = Math.max(1, land)
  world.initialSeaRow = sea
}
export function pickWorld(world, point) {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x >= WORLD.width || point.y >= WORLD.height) return null
  return { x: Math.floor(point.x / WORLD.width * world.columns), y: Math.floor(point.y / WORLD.height * world.rows) }
}
