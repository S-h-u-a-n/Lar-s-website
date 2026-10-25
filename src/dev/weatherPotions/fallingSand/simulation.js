import { MATERIAL as M, POTIONS, RULES as R, WORLD } from './config.js'
import { clamp, makeTerrain } from './terrain.js'
import { climate, inject } from './weather.js'
import { updateMaterials } from './materials.js'
import { evaluateEnding } from './endings.js'
import { observe } from './observations.js'
export { setInput, stopInput } from './weather.js'
export const WORLD_VERSION = 4

export function createWorld({ columns=WORLD.columns, rows=WORLD.rows }={}) {
  const size=columns*rows
  const world={
    version:WORLD_VERSION,columns,rows,
    material:new Uint8Array(size),temperatureGrid:new Float32Array(size),moisture:new Float32Array(size),
    tint:new Uint8Array(size),origin:new Uint8Array(size),age:new Uint16Array(size),exposure:new Uint16Array(size),updated:new Uint32Array(size),
    initialSurface:new Int16Array(columns),dryColumns:new Uint8Array(columns),counts:new Uint32Array(9),
    temperature:18,light:55,time:0,tick:0,paintRevision:0,remainder:0,random:WORLD.seed, input:null,emission:0,
    observations:[],observed:new Set(),ending:null,endingTimers:{},disasters:new Set(),
    doses:Object.fromEntries(POTIONS.map(p=>[p.id,0])),
    cloudiness:0,wind:0,storm:0,rainbow:0,rainMemory:0,stress:0,extreme:0,
    rainAdded:0,snowAdded:0,lavaAdded:0,cloudAdded:0,steamCreated:0,basaltCreated:0,
    naturalRain:0,evaporated:0,condensed:0,frozen:0,melted:0,moves:0,windMoves:0,injected:0,eroded:0,fractured:0,
    seaLevel:0,riseRate:0,metrics:{moisture:.62,ice:0,snow:0,desert:0,erosion:0,damage:0,lostLand:0,flood:0,liquidRemaining:1},
  }
  makeTerrain(world)
  for(const kind of world.material)world.counts[kind]++
  measureWorld(world,true)
  return world
}
export function measureWorld(world,initial=false) {
  const w=world.columns,h=world.rows,mat=world.material
  let lost=0,snow=0,soil=0,dry=0,wet=0,surfaceSum=0,seaColumns=0
  for(let x=0;x<w;x++) {
    let surface=h,waterSurface=h
    for(let y=0;y<h;y++) {
      const kind=mat[y*w+x]
      if(surface===h && (kind===M.SOIL || kind===M.ROCK))surface=y
      // Three adjacent liquid/ice cells distinguish a water body from falling rain.
      if(waterSurface===h && y<h-2 && [M.WATER,M.ICE].includes(kind) && [M.WATER,M.ICE].includes(mat[(y+1)*w+x]) && [M.WATER,M.ICE].includes(mat[(y+2)*w+x]))waterSurface=y
    }
    if(x>w*.73){surfaceSum+=waterSurface;seaColumns++}
    if(world.dryColumns[x]) {
      if(waterSurface<world.initialSurface[x]-2 || surface>world.initialSurface[x]+Math.max(5,(world.initialSeaRow-world.initialSurface[x])*.2))lost++
      const top=Math.max(0,surface-1)
      if(mat[top*w+x]===M.SNOW || mat[top*w+x]===M.ICE)snow++
    }
  }
  for(let i=0;i<mat.length;i++)if(mat[i]===M.SOIL) {
    soil++;wet+=world.moisture[i];if(world.moisture[i]<.18)dry++
  }
  const seaRow=surfaceSum/Math.max(1,seaColumns)
  const level=(h-seaRow)/h*100, before=world.seaLevel
  world.seaLevel=level
  if(!initial)world.riseRate+=( (level-before)/(6/R.fps)-world.riseRate)*.25
  const waterFamily=world.counts[M.WATER]+world.counts[M.ICE]
  world.metrics={
    moisture:wet/Math.max(1,soil),desert:dry/Math.max(1,soil),snow:snow/world.initialLandColumns,
    ice:world.counts[M.ICE]/Math.max(1,waterFamily),erosion:clamp(world.eroded/world.initialFragile),damage:clamp(world.fractured/world.initialFragile),
    lostLand:lost/world.initialLandColumns,flood:clamp((world.initialSeaRow-seaRow)/h),liquidRemaining:world.counts[M.WATER]/world.initialWater,
  }
  if(world.metrics.ice>.35)world.disasters.add('freeze')
  const availableWater=world.counts[M.WATER]+world.counts[M.ICE]+world.counts[M.SNOW]
  if(world.temperature>35 && world.metrics.desert>.55 && availableWater<world.initialWater*.6)world.disasters.add('drought')
  if(world.temperature>=48 && world.metrics.desert>.55 && world.metrics.moisture<.25)world.disasters.add('heatwave')
  if(world.metrics.flood>.18)world.disasters.add('flood')
  if(world.basaltCreated>200)world.disasters.add('volcano')
  if(world.metrics.desert>.2)observe(world,'desert')
  if(world.windMoves>15)observe(world,'wind')
}
export function stepWorld(world,dt=1/R.fps) {
  if(world.ending || !Number.isFinite(dt) || dt<=0)return
  const fixed=1/R.fps
  world.remainder+=Math.min(dt,fixed)
  if(world.remainder+1e-9<fixed)return
  world.remainder-=fixed;dt=fixed
  world.time+=dt;world.tick++
  climate(world,dt);inject(world,dt);updateMaterials(world)
  if(world.tick%6===0)measureWorld(world)
  evaluateEnding(world,dt)
}
export function snapshotWorld(world) {
  return {
    temperature:world.temperature,light:world.light,seaLevel:world.seaLevel,riseRate:world.riseRate,metrics:{...world.metrics},
    observations:[...world.observations],ending:world.ending,input:world.input?.type || null,time:world.time,
    particles:world.counts[M.WATER]+world.counts[M.SNOW]+world.counts[M.LAVA]+world.counts[M.STEAM]+world.counts[M.CLOUD],
    rainAdded:world.rainAdded,snowAdded:world.snowAdded,lavaAdded:world.lavaAdded,cloudAdded:world.cloudAdded,
    wind:world.wind,storm:world.storm,cloudiness:world.cloudiness,rainbow:world.rainbow,steamCreated:world.steamCreated,basaltCreated:world.basaltCreated,
    counts:[...world.counts],doses:{...world.doses},condensed:world.condensed,evaporated:world.evaporated,naturalRain:world.naturalRain,moves:world.moves,
  }
}
