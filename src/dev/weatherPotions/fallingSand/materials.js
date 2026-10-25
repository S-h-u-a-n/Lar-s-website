import { MATERIAL as M, RULES as R } from './config.js'
import { environmentTemperature, random, windAt } from './weather.js'
import { observe } from './observations.js'

export function change(world, i, material) {
  const old = world.material[i]
  if (old === material) return
  world.counts[old]--; world.counts[material]++
  world.material[i] = material; world.age[i] = 0; world.updated[i] = world.tick
}
function exchange(world, from, to) {
  for (const field of ['material', 'temperatureGrid', 'moisture', 'origin', 'tint', 'age', 'exposure']) {
    const array = world[field], value = array[from]; array[from] = array[to]; array[to] = value
  }
  world.updated[from] = world.updated[to] = world.tick
  world.moves++
}
function target(world, x, y) { return x < 0 || y < 0 || x >= world.columns || y >= world.rows ? -1 : y * world.columns + x }
function lighter(kind, material) {
  return kind === M.AIR || kind === M.STEAM || kind === M.CLOUD || ((material === M.SOIL || material === M.ROCK) && kind === M.WATER)
}
function move(world, i, x, y, material) {
  const to = target(world, x, y)
  if (to < 0 || !lighter(world.material[to], material)) return false
  exchange(world, i, to); return true
}
function gasMove(world, i, x, y) {
  const to = target(world, x, y)
  if (to < 0 || world.material[to] !== M.AIR) return false
  exchange(world, i, to); return true
}
function neighbor(world, x, y, kind) {
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const i = target(world, x + dx, y + dy)
    if (i >= 0 && world.material[i] === kind) return i
  }
  return -1
}
function fluid(world, i, x, y, material, slow = false) {
  if (slow && world.tick % 4 !== 0) return
  const direction = random(world) < .5 ? -1 : 1
  const velocity=windAt(world,x,y),drift=Math.sign(velocity.x)||direction
  if (material === M.WATER && world.wind > .15 && neighbor(world,x,y,M.AIR) >= 0 && random(world) < world.wind * .45) {
    const lift=world.material[i+world.columns]===M.AIR && Math.abs(velocity.y)>.45?Math.sign(velocity.y):0
    if (move(world,i,x+drift,y+lift,material)) { world.windMoves++; return }
  }
  if (material === M.WATER && y+2<world.rows && lighter(world.material[i+world.columns],material) && move(world,i,x,y+2,material)) return
  if (move(world,i,x,y+1,material) || move(world,i,x+direction,y+1,material) || move(world,i,x-direction,y+1,material)) return
  // Search the full path, so fluids cannot tunnel through a wall.
  const reach = slow ? 2 : 5
  for (const sign of [direction,-direction]) {
    let best = -1
    for (let n=1;n<=reach;n++) {
      const to=target(world,x+sign*n,y)
      if (to<0 || !lighter(world.material[to],material)) break
      best=to
      const below=target(world,x+sign*n,y+1)
      if (below>=0 && lighter(world.material[below],material)) break
    }
    if (best>=0) { exchange(world,i,best); return }
  }
  if (material===M.WATER && world.storm>.25 && random(world)<world.storm*.06 && move(world,i,x+drift,y-1,material)) world.windMoves++
}
function breakRock(world, i, cause) {
  change(world,i,M.SOIL)
  if (world.origin[i]===2) {
    world.origin[i]=3
    if(cause==='erode')world.eroded++
    else world.fractured++
  }
  observe(world,cause)
}
function quench(world,lava,water) {
  change(world,water,M.STEAM);world.temperatureGrid[water]=95
  change(world,lava,M.ROCK);world.temperatureGrid[lava]=55;world.origin[lava]=0
  world.steamCreated++;world.basaltCreated++;observe(world,'steam');observe(world,'basalt')
}
export function updateMaterials(world) {
  const w=world.columns,h=world.rows
  // A moved/converted particle is stamped, so it runs once per fixed step.
  // Alternate each row's horizontal direction to remove scan bias.
  for(let y=h-1;y>=0;y--) {
    const reverse=(world.tick+y)%2
    for(let n=0;n<w;n++) {
      const x=reverse?w-1-n:n,i=y*w+x,material=world.material[i]
      if(material===M.AIR || world.updated[i]===world.tick)continue
      world.updated[i]=world.tick
      world.age[i]=Math.min(65535,world.age[i]+1)
      const env=material===M.WATER || material===M.ICE ? world.temperature : environmentTemperature(world,y)
      const lavaNeighbor=neighbor(world,x,y,M.LAVA)
      world.temperatureGrid[i]+=(env-world.temperatureGrid[i])*(material===M.LAVA?.002:.035)
      if(lavaNeighbor>=0 && material!==M.LAVA)world.temperatureGrid[i]+=(world.temperatureGrid[lavaNeighbor]-world.temperatureGrid[i])*.07
      const temp=world.temperatureGrid[i],above=target(world,x,y-1)
      // Resolve either side of a contact before movement, independent of scan order.
      if(lavaNeighbor>=0 && [M.WATER,M.SNOW,M.ICE].includes(material)) {quench(world,lavaNeighbor,i);continue}
      if(material===M.WATER) {
        const supported=y===h-1 || (i+w<world.material.length && ![M.AIR,M.STEAM,M.CLOUD].includes(world.material[i+w]))
        if(supported && temp<0 && ((above>=0 && [M.AIR,M.ICE,M.SNOW].includes(world.material[above])) || neighbor(world,x,y,M.ICE)>=0) && random(world)<R.freeze*(1+Math.abs(temp)/35)) {
          change(world,i,M.ICE);world.frozen++;observe(world,'freeze');continue
        }
        if(temp>24 && above>=0 && world.material[above]===M.AIR && random(world)<R.evaporation*(temp-24)/10*(world.light/65+world.wind*.4)) {
          change(world,i,M.STEAM);world.temperatureGrid[i]=Math.max(35,temp);world.evaporated++;observe(world,'evaporate');continue
        }
        if(above>=0 && world.material[above]!==M.WATER && y>world.initialSeaRow-15)observe(world,'pool')
        fluid(world,i,x,y,material)
      } else if(material===M.ICE || material===M.SNOW) {
        if(temp>2 && random(world)<R.thaw*(1+temp/30)) {
          change(world,i,M.WATER);world.melted++;observe(world,'melt');continue
        }
        if(material===M.ICE)continue
        if(world.tick%2===0) {
          const sign=world.wind>.2?(Math.sign(windAt(world,x,y).x)||1):(random(world)<.5?-1:1)
          if(world.wind>.2 && random(world)<world.wind*.5 && move(world,i,x+sign,y,material)){world.windMoves++;continue}
          if(move(world,i,x,y+1,material) || move(world,i,x+sign,y+1,material) || move(world,i,x-sign,y+1,material))continue
        }
        // Settled snow gradually compacts to ice under another snow layer.
        if(world.age[i]>300 && above>=0 && world.material[above]===M.SNOW && random(world)<.015)change(world,i,M.ICE)
      } else if(material===M.LAVA) {
        const water=neighbor(world,x,y,M.WATER),frozen=neighbor(world,x,y,M.ICE),snow=neighbor(world,x,y,M.SNOW)
        const contact=water>=0?water:frozen>=0?frozen:snow
        if(contact>=0) {
          quench(world,i,contact);continue
        }
        if(temp<80 || world.age[i]>R.lavaCooling) {
          change(world,i,M.ROCK);world.origin[i]=0;world.basaltCreated++;observe(world,'basalt');continue
        }
        fluid(world,i,x,y,material,true)
      } else if(material===M.STEAM) {
        if(temp<19 && world.age[i]>45 && random(world)<R.condensation*(1+(19-temp)/10)) {
          change(world,i,M.CLOUD);world.condensed++;observe(world,'condense');continue
        }
        const velocity=windAt(world,x,y),sign=world.wind>.2?(Math.sign(velocity.x)||1):(random(world)<.5?-1:1)
        const lift=world.storm>.25 && Math.abs(velocity.y)>.45?Math.sign(velocity.y):0
        if(world.wind>.2 && gasMove(world,i,x+sign,y+lift)){world.windMoves++;continue}
        if(y>1 && world.material[(y-1)*w+x]===M.AIR && gasMove(world,i,x,y-2))continue
        if(gasMove(world,i,x,y-1) || gasMove(world,i,x+sign,y-1))continue
        gasMove(world,i,x+sign,y)
      } else if(material===M.CLOUD) {
        let crowd=0
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const at=target(world,x+dx,y+dy);if(at>=0 && world.material[at]===M.CLOUD)crowd++}
        if(world.age[i]>300 && crowd>=4 && random(world)<.007*(1+world.storm)) {
          change(world,i,temp<-4?M.SNOW:M.WATER);world.naturalRain++;observe(world,'precipitate');continue
        }
        if(random(world)>.07+world.wind*.65)continue
        const velocity=windAt(world,x,y),sign=world.wind>.2?(Math.sign(velocity.x)||1):(random(world)<.5?-1:1)
        const band=Math.round(h*.16+Math.sin(x/w*9)*h*.025)
        const dy=world.storm>.25?Math.abs(velocity.y)>.25?Math.sign(velocity.y):0:y>band+3?-1:y<band-3?1:0
        if(gasMove(world,i,x+sign,y+dy)){if(world.wind>.2)world.windMoves++;continue}
        gasMove(world,i,x,y+dy)
      } else if(material===M.SOIL || material===M.ROCK) {
        const water=neighbor(world,x,y,M.WATER)
        if(material===M.SOIL) {
          world.moisture[i]=Math.max(0,Math.min(1,world.moisture[i]+(water>=0?.035:-Math.max(0,temp-23)*.000085)))
          if(temp>180) {change(world,i,M.LAVA);world.temperatureGrid[i]=280;continue}
          const sign=random(world)<.5?-1:1
          if(move(world,i,x,y+1,material))continue
          if(world.moisture[i]>.8 || (i+w<world.material.length && world.material[i+w]===M.AIR)) {
            if(move(world,i,x+sign,y+1,material) || move(world,i,x-sign,y+1,material))continue
          }
        } else if(world.origin[i]===0) {
          // Fresh cooled basalt is heavy: it settles through water, rather
          // than becoming a permanently suspended rock in the sky.
          if(move(world,i,x,y+1,material))continue
          const sign=random(world)<.5?-1:1
          if(i+w<world.material.length && world.material[i+w]===M.AIR) {
            if(move(world,i,x+sign,y+1,material) || move(world,i,x-sign,y+1,material))continue
          }
        } else if(y<h-5) {
          if(temp>230) {breakRock(world,i,'fracture');continue}
          if(world.origin[i]===2 && y<world.initialSeaRow+h*.1) {
            if(world.stress>.1 && random(world)<R.fracture*world.stress) {breakRock(world,i,'fracture');continue}
            if(water>=0 && world.metrics.flood>.045 && world.temperature>2)world.exposure[i]=Math.min(65535,world.exposure[i]+1)
            else world.exposure[i]=Math.max(0,world.exposure[i]-1)
            if(world.exposure[i]>120 && random(world)<R.erosion) {breakRock(world,i,'erode');continue}
          }
        }
      }
    }
  }
}
