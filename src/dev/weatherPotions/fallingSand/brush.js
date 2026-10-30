import { POTIONS, RULES as R } from './config.js'
import { clamp } from './terrain.js'
import { random, spawnAt, applyLocalTemperature } from './weather.js'
import { brushSettings } from './brushSettings.js'

// Arc-length interpolation: pointer event frequency cannot leave gaps.
// No queued points: every dab is applied now, and release cancels the source.
export function strokePoints(from,to,spacing=R.brushSpacing) {
  if(!from)return [{x:to.x,y:to.y}]
  const distance=Math.hypot(to.x-from.x,to.y-from.y)
  const steps=Math.max(1,Math.ceil(distance/Math.max(.4,spacing)))
  return Array.from({length:steps},(_,i)=>({x:from.x+(to.x-from.x)*(i+1)/steps,y:from.y+(to.y-from.y)*(i+1)/steps}))
}
export function paintStroke(world,type,from,to,strength=R.defaultStrength,tap=false,size=R.defaultBrush) {
  if(world.ending || !POTIONS.some(p=>p.id===type) || !to || !Number.isFinite(to.x) || !Number.isFinite(to.y) || !Number.isFinite(strength))return 0
  strength=clamp(strength,.1,1)
  const {radius,spacing,dabs,power}=brushSettings(type,strength,size)
  // Share a bounded footprint across coalesced events in the same physics step.
  // Repeated overlapping dabs must not pour another column above each old cell.
  const brushKey=`${world.tick}:${type}:${size}`
  if(world.brushKey!==brushKey){world.brushKey=brushKey;world.brushVisited=new Set();world.brushThermalVisited=new Set()}
  const deposit=(x,y)=>{
    const ix=Math.round(x),iy=Math.round(y)
    if(ix<1||iy<1||ix>=world.columns-1||iy>=world.rows-1)return false
    const key=iy*world.columns+ix
    if(world.brushVisited.has(key))return false
    world.brushVisited.add(key)
    return spawnAt(world,type,ix,iy,true)
  }
  let created=0
  for(const point of strokePoints(from,to,spacing)) {
    if(point.x<0 || point.y<0 || point.x>=world.columns || point.y>=world.rows)continue
    if(type==='sun' || type==='cold') {
      for(let dy=-Math.ceil(radius);dy<=radius;dy++)for(let dx=-Math.ceil(radius);dx<=radius;dx++) {
        if(dx*dx+dy*dy>radius*radius)continue
        const x=Math.round(point.x+dx),y=Math.round(point.y+dy)
        if(x<0 || y<0 || x>=world.columns || y>=world.rows)continue
        const i=y*world.columns+x
        if(world.brushThermalVisited.has(i))continue
        world.brushThermalVisited.add(i)
        const before=world.temperatureGrid[i]
        world.temperatureGrid[i]=type==='sun'?Math.max(world.temperatureGrid[i],Math.min(90,world.temperatureGrid[i]+(90-world.temperatureGrid[i])*.15*strength*power)):Math.max(-55,world.temperatureGrid[i]-8*strength*power)
        applyLocalTemperature(world,i,world.temperatureGrid[i]-before)
      }
    }
    if(['rain','cold','cloud','lava','sand','growth'].includes(type)) {
      // Always mark the centre, then fill a small physical footprint.
      if(deposit(point.x,point.y))created++
      for(let i=0;i<dabs;i++) {
        const angle=random(world)*Math.PI*2,distance=Math.sqrt(random(world))*radius
        if(deposit(point.x+Math.cos(angle)*distance,point.y+Math.sin(angle)*distance))created++
      }
    }
  }
  if(tap) {
    if(type==='sun'){world.temperature=clamp(world.temperature+R.sunHeat*R.tapSeconds*strength*power,R.minTemperature,R.maxTemperature);world.light=Math.max(world.light,55+Math.min(30,30*strength*power))}
    if(type==='cold')world.temperature=clamp(world.temperature+R.coldHeat*R.tapSeconds*strength*power,R.minTemperature,R.maxTemperature)
    if(type==='wind')world.wind=clamp(world.wind+.035*strength*power)
    if(type==='rainbow')world.rainbow=clamp(world.rainbow+.12*strength*power)
  }
  world.paintRevision++
  return created
}
