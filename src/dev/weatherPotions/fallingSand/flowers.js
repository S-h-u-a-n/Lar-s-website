import { MATERIAL as M, PALETTE as P, RULES as R } from './config.js'

// A visual detail of existing plant cells, not another material or growth stage.
// Use their age/tint rather than consuming simulation randomness or air cells.
export function paintPlantFlowers(world, data) {
  if (!world.counts[M.PLANT]) return
  const w = world.columns, h = world.rows, mat = world.material
  const paint = (i, color) => {
    const offset = i * 4
    data[offset] = color[0]; data[offset + 1] = color[1]; data[offset + 2] = color[2]
  }
  for (let i = w; i < mat.length - w; i++) {
    if (mat[i] !== M.PLANT || world.age[i] < R.plantBloomDelay * R.fps ||
        world.plantDepth[i] < 3 || world.plantStress[i] > 1 ||
        world.moisture[i] < .18 || world.temperatureGrid[i] < 3 ||
        world.temperatureGrid[i] > 38 || world.light < 18) continue
    const x = i % w, y = Math.floor(i / w)
    if (x < 1 || x >= w - 1 || y >= h - 1) continue
    // Only exposed tips bloom; never put flowers along an enclosed stem.
    if (mat[i-w] !== M.AIR || mat[i-w-1] === M.PLANT || mat[i-w+1] === M.PLANT) continue
    const root = world.plantRoot[i] - 1, parent = world.plantParent[i] - 1
    if (root < 0 || ![M.SOIL, M.SAND].includes(mat[root]) || parent < 0 ||
        !(parent === root || (mat[parent] === M.PLANT && world.plantRoot[parent] === root + 1))) continue
    const color = P.flowers[world.tint[i] % P.flowers.length]
    // Leave water, snow, terrain and other particles visible in front of petals.
    for (const at of [i-w, i-1, i+1, i+w]) if (mat[at] === M.AIR) paint(at, color)
    paint(i, P.flowerCenter)
  }
}
