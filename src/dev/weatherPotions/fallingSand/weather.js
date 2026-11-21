import { MATERIAL as M, POTIONS, RULES as R } from './config.js'
import { clamp } from './terrain.js'
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
  return world.temperature - Math.max(0, world.rows * .49 - y) / world.rows * R.upperAirCooling
}
// Air temperature is evaluated live: empty cells' material temperatures are
// not continuously updated. A short-lived local brush anomaly stays in space.
export function precipitationTemperature(world, x, y) {
  const i=y*world.columns+x
  const offset=world.thermalOffset[i]
  return environmentTemperature(world,y)+(offset ? offset*Math.exp(-(world.tick-world.thermalTick[i])/(R.fps*R.localThermalSeconds)) : 0)
}
export function applyLocalTemperature(world, i, delta) {
  const previous=world.thermalOffset[i]*Math.exp(-(world.tick-world.thermalTick[i])/(R.fps*R.localThermalSeconds))
  world.thermalOffset[i]=clamp(previous+delta,-55,55)
  world.thermalTick[i]=world.tick
}
export function snowProbability(temperature) {
  const t=clamp((R.precipitationMixBand-temperature)/(2*R.precipitationMixBand))
  return t*t*(3-2*t)
}
export function precipitationMaterial(world, temperature) {
  const snow=snowProbability(temperature)
  return snow===1 || (snow>0 && random(world)<snow) ? M.SNOW : M.WATER
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
}
function freeAt(world, x, y) {
  return x >= 0 && y >= 0 && x < world.columns && y < world.rows && world.material[y * world.columns + x] === M.AIR
}
export function spawnAt(world,type,x,y,brush=false) {
  if(world.ending || !['rain','cold','cloud','lava','sand','growth'].includes(type) || !world.counts[M.AIR])return false
  x=clamp(Math.round(x),1,world.columns-2);y=clamp(Math.round(y),1,world.rows-2)
  if(type==='growth' && world.counts[M.GROWTH]>=Math.min(R.growthMaxParticles,world.material.length*.02))return false
  if(type==='cloud')y=Math.min(y,Math.round(world.rows*.42))
  if(brush || type==='lava' || type==='sand' || type==='growth')while(y>1 && !freeAt(world,x,y))y--
  if(!freeAt(world,x,y))return false
  const formationTemperature=precipitationTemperature(world,x,y)
  const material=type==='growth'?M.GROWTH:type==='sand'?M.SAND:type==='lava'?M.LAVA:type==='cloud'?M.CLOUD:type==='cold'?M.SNOW:precipitationMaterial(world,formationTemperature)
  const i=y*world.columns+x
  world.material[i]=material
  world.temperatureGrid[i]=material===M.LAVA?520:[M.WATER,M.SNOW].includes(material)?formationTemperature:environmentTemperature(world,y)
  world.age[i]=0;world.snowRestTicks[i]=0;world.origin[i]=type==='cold'?5:[M.WATER,M.SNOW].includes(material)?4:0;world.moisture[i]=0;world.sandHeat[i]=0
  world.counts[material]++;world.counts[M.AIR]--;world.injected++
  if(material===M.GROWTH){world.growthAdded++}
  else if(material===M.SAND){world.sandAdded++}
  else if(material===M.LAVA){world.lavaAdded++;}
  else if(material===M.CLOUD){world.cloudAdded++;}
  else if(material===M.SNOW){world.snowAdded++;}
  else {world.rainAdded++;}
  return true
}
export function inject(world, dt) {
  const input=world.input
  if(!input || !['rain','cold','cloud','lava','sand','growth'].includes(input.type))return
  const brush=input.brushSize?brushSettings(input.type,input.strength,input.brushSize):null
  const rate=brush?brush.flow:(input.type==='rain'?R.rainRate:input.type==='cold'?R.snowRate:input.type==='cloud'?R.cloudRate:input.type==='sand'?R.sandRate:input.type==='growth'?R.growthRate:R.lavaRate)*input.strength
  world.emission+=rate*world.columns/210*dt
  while(world.emission>=1) {
    world.emission--
    let x,y
    if(input.mode==='brush') {
      const radius=brush.radius
      const angle=random(world)*Math.PI*2,distance=Math.sqrt(random(world))*radius
      x=input.x+Math.cos(angle)*distance;y=input.y+Math.sin(angle)*distance
    } else if(['lava','sand','growth'].includes(input.type)) {
      const radius=input.type==='sand'?R.sandRadius:input.type==='growth'?R.growthRadius:R.lavaRadius
      x=input.x+(random(world)-.5)*radius*2;y=input.y
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
