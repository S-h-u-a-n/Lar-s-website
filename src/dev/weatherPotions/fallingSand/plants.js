import { MATERIAL as M, RULES as R } from './config.js'

// Independently implemented local growth rules, informed by Sandspiel's
// species.rs (MIT). No Rust/WASM code is embedded or translated here.
export const plantLimit = world => Math.min(R.plantMaxCells, Math.floor(world.material.length * .035))
function putPlant(world, i, root, parent, depth) {
  if (world.material[i] !== M.AIR || world.counts[M.PLANT] >= plantLimit(world)) return false
  world.material[i] = M.PLANT; world.counts[M.AIR]--; world.counts[M.PLANT]++
  world.plantRoot[i] = root + 1; world.plantParent[i] = parent + 1
  world.plantDepth[i] = depth; world.plantStress[i] = 0
  world.moisture[i] = world.moisture[root]; world.temperatureGrid[i] = world.temperatureGrid[root]
  world.origin[i] = 0; world.age[i] = 0; world.updated[i] = world.tick
  world.plantsGrown++; 
  return true
}
export function seedPlant(world, x, y) {
  if (world.counts[M.PLANT] >= plantLimit(world)) return false
  // Project onto the first surface, never seed through rock or water.
  for (; y < world.rows - 1; y++) {
    const root = y * world.columns + x, kind = world.material[root]
    if ([M.AIR, M.STEAM, M.CLOUD].includes(kind)) continue
    if (![M.SOIL, M.SAND].includes(kind) || y < 1) return false
    if (kind === M.SAND) {
      // Only a thin, moist sandy layer with nearby soil supports this plant.
      let soil = false
      for (let d = 1; d <= 3 && y + d < world.rows; d++) {
        const below = world.material[root + d * world.columns]
        if (below === M.SOIL) { soil = true; break }
        if (below !== M.SAND) break
      }
      if (!soil || world.moisture[root] < .25) return false
    }
    if (world.moisture[root] < .15 || world.temperatureGrid[root] < 2 || world.temperatureGrid[root] > 40 || world.light < 12) return false
    const planted = putPlant(world, root - world.columns, root, root, 1)
    if (planted) world.plantsSeeded++
    return planted
  }
  return false
}

// A consumed growth grain only activates reachable, nearby shore/soil surfaces.
// Search through air/water, never through a rock wall or across the whole map.
export function activateGrowth(world, x, y) {
  const queue = [[x,y,0]], visited = new Set([y*world.columns+x])
  for (let head=0;head<queue.length;head++) {
    const [cx,cy,distance]=queue[head], i=cy*world.columns+cx
    if (world.material[i]===M.AIR && cy+1<world.rows &&
        [M.SOIL,M.SAND].includes(world.material[i+world.columns]) && seedPlant(world,cx,cy+1)) return true
    if (distance>=R.growthActivationRadius) continue
    for (const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]]) {
      const nx=cx+dx,ny=cy+dy,at=ny*world.columns+nx
      if(nx<1 || nx>=world.columns-1 || ny<1 || ny>=world.rows-1 || visited.has(at))continue
      if(![M.AIR,M.WATER,M.STEAM,M.CLOUD].includes(world.material[at]))continue
      visited.add(at);queue.push([nx,ny,distance+1])
    }
  }
  return false
}
export function updatePlant(world, i, x, y, temp, lavaNeighbor, random, change) {
  const root = world.plantRoot[i] - 1, parent = world.plantParent[i] - 1
  const substrate = root >= 0 && [M.SOIL, M.SAND].includes(world.material[root])
  const supported = substrate && parent >= 0 && (parent === root ||
    (world.material[parent] === M.PLANT && world.plantRoot[parent] === root + 1))
  let water = false
  for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
    const nx=x+dx, ny=y+dy
    if (nx>=0 && ny>=0 && nx<world.columns && ny<world.rows && world.material[ny*world.columns+nx]===M.WATER) water=true
  }
  if (supported && water) world.moisture[root] = Math.min(1, world.moisture[root] + .012)
  const moisture = substrate ? world.moisture[root] : 0
  world.moisture[i] = moisture
  const stress = !supported || lavaNeighbor>=0 || temp>70 ? 12 :
    moisture<.12 ? 1.2 : temp < -15 ? 1.5 : temp>42 ? 1.4 : 0
  world.plantStress[i] = Math.max(0, world.plantStress[i] + (stress || -.6) / R.fps)
  if (world.plantStress[i] >= R.plantStressLimit) {
    change(world, i, M.AIR); world.plantsWilted++
     return
  }
  if (!supported || temp<3 || temp>38 || moisture<.18 || world.light<18 ||
      world.age[i]<24 || world.plantDepth[i]>=R.plantMaxDepth || world.counts[M.PLANT]>=plantLimit(world)) return
  const rate=R.plantGrowthChance*Math.min(1,moisture/.6)*Math.min(1,world.light/75)
  if (random(world)>=rate) return
  const dx=random(world)<.65?0:random(world)<.5?-1:1, nx=x+dx, ny=y-1
  if (nx<1 || nx>=world.columns-1 || ny<1 || Math.abs(nx-root%world.columns)>R.plantSpread) return
  if (putPlant(world,ny*world.columns+nx,root,i,world.plantDepth[i]+1)) {
    // Moisture is a soil indicator, not part of the conserved water-cell count.
    world.moisture[root]=Math.max(0,world.moisture[root]-.003)
  }
}
