import { MATERIAL as M, POTIONS, RULES as R } from './config.js'
import { clamp } from './terrain.js'
import { observe } from './observations.js'
import { brushSettings } from './brushSettings.js'

export function random(world) {
  world.random = (Math.imul(world.random, 1664525) + 1013904223) >>> 0
  return world.random / 4294967296
}
export function setInput(world, type, location = { x: world.columns * .50, y: world.rows * .28 }, strength = R.defaultStrength) {
  if (world.ending || !POTIONS.some(p => p.id === type) || !Number.isFinite(strength) || !Number.isFinite(location.x) || !Number.isFinite(location.y)) return
  world.input = { type, x: clamp(Math.floor(location.x), 0, world.columns - 1), y: clamp(Math.floor(location.y), 0, world.rows - 1), strength: clamp(strength, .1, 1), mode: location.mode === 'brush' ? 'brush' : 'weather', brushSize: location.brushSize || (location.mode === 'brush' ? R.defaultBrush : null) }
}
export function stopInput(world) { world.input = null; world.emission = 0 }
export function environmentTemperature(world, y) {
  return world.temperature - Math.max(0, world.rows * .49 - y) / world.rows * 50
}
export function windAt(world,x,y) {
  const base=Math.sin(world.time*.15)>=0?1:-1
  if(world.storm<.25)return {x:base,y:0}
  const dx=x-world.columns*.72,dy=y-world.rows*.24
  const radius=Math.max(8,Math.hypot(dx,dy))
  return {x:base*.35-dy/radius*world.storm*1.7,y:dx/radius*world.storm*.9}
}
export function climate(world, dt) {
  const type = world.input?.type, strength = world.input?.strength || 0
  const dose=strength*(world.input?.brushSize?brushSettings(type,strength,world.input.brushSize).power:1)
  if (type) world.doses[type] += dt * strength
  world.wind = clamp(world.wind + dt * (type === 'wind' ? R.windGain * dose : -R.windDecay))
  const cloudTarget = Math.min(1, world.counts[M.CLOUD] / (world.columns * 2.2))
  world.cloudiness += (cloudTarget - world.cloudiness) * dt * 1.5
  world.rainMemory = clamp(world.rainMemory + dt * (type === 'rain' ? .12 * dose : -.008))
  const targetStorm = world.wind > .55 && world.rainMemory > .25 && world.cloudiness > .12 ? world.wind : 0
  world.storm += (targetStorm - world.storm) * dt * .8
  const heat = (type === 'sun' ? R.sunHeat * (1 - world.cloudiness * .68) : type === 'cold' ? R.coldHeat : type === 'rain' ? -.12 : type === 'lava' ? .5 : 0) * dose
  world.temperature = clamp(world.temperature + heat * dt + (18 - world.temperature) * R.climateReturn * dt, R.minTemperature, R.maxTemperature)
  const light = (type === 'sun' ? 100 : 57) * (1 - world.cloudiness * .74)
  world.light += (light - world.light) * dt * (type ? 1 : .2)
  const rainbow = world.rainMemory > .2 && world.light > 58 && world.cloudiness < .8
  world.rainbow = clamp(world.rainbow + dt * (type === 'rainbow' ? .25 * dose : rainbow ? .065 : -.028))
  const extreme = world.temperature >= 48 ? 1 : world.temperature <= -14 ? -1 : 0
  if (extreme && extreme !== world.extreme) {
    if (world.extreme) world.stress = clamp(world.stress + .23)
    world.extreme = extreme
  }
  if (world.rainbow > .2) observe(world, 'rainbow')
  if (world.storm > .25) observe(world, 'storm')
}
function freeAt(world, x, y) {
  return x >= 0 && y >= 0 && x < world.columns && y < world.rows && world.material[y * world.columns + x] === M.AIR
}
export function spawnAt(world,type,x,y,brush=false) {
  if(world.ending || !['rain','cold','cloud','lava'].includes(type) || !world.counts[M.AIR])return false
  x=clamp(Math.round(x),1,world.columns-2);y=clamp(Math.round(y),1,world.rows-2)
  if(type==='cloud')y=Math.min(y,Math.round(world.rows*.42))
  if(brush || type==='lava')while(y>1 && !freeAt(world,x,y))y--
  if(!freeAt(world,x,y))return false
  const material=type==='lava'?M.LAVA:type==='cloud'?M.CLOUD:type==='cold'||world.temperature<0?M.SNOW:M.WATER
  const i=y*world.columns+x
  world.material[i]=material
  world.temperatureGrid[i]=material===M.LAVA?520:material===M.WATER?world.temperature:environmentTemperature(world,y)
  world.age[i]=0;world.origin[i]=0;world.moisture[i]=0
  world.counts[material]++;world.counts[M.AIR]--;world.injected++
  if(material===M.LAVA){world.lavaAdded++;observe(world,'lava')}
  else if(material===M.CLOUD){world.cloudAdded++;observe(world,'cloud')}
  else if(material===M.SNOW){world.snowAdded++;observe(world,'snow')}
  else {world.rainAdded++;observe(world,'rain')}
  return true
}
export function inject(world, dt) {
  const input=world.input
  if(!input || !['rain','cold','cloud','lava'].includes(input.type))return
  const brush=input.brushSize?brushSettings(input.type,input.strength,input.brushSize):null
  const rate=brush?brush.flow:(input.type==='rain'?R.rainRate:input.type==='cold'?R.snowRate:input.type==='cloud'?R.cloudRate:R.lavaRate)*input.strength
  world.emission+=rate*world.columns/210*dt
  while(world.emission>=1) {
    world.emission--
    let x,y
    if(input.mode==='brush') {
      const radius=brush.radius
      const angle=random(world)*Math.PI*2,distance=Math.sqrt(random(world))*radius
      x=input.x+Math.cos(angle)*distance;y=input.y+Math.sin(angle)*distance
    } else if(input.type==='lava') {
      x=input.x+(random(world)-.5)*R.lavaRadius*2;y=input.y
    } else if(input.type==='cloud') {
      const bank=Math.floor(random(world)*3)
      x=world.columns*(.20+bank*.29)+(random(world)+random(world)-1)*world.columns*.12
      y=world.rows*(.13+bank%2*.04)+(random(world)+random(world)-1)*world.rows*.025
    } else {
      const radius=(input.type==='cold'?R.snowRadius:R.rainRadius)*(brush?brush.radius/(R.brushRadius[input.type]*Math.sqrt(input.strength)*.60):1)
      x=input.x+(random(world)+random(world)-1)*world.columns*radius*2
      y=2+random(world)*world.rows*.06
    }
    spawnAt(world,input.type,x,y,input.mode==='brush')
  }
}
