import { POTIONS, RULES as R, WORLD } from './config.js'
import { clamp, findSeaLevel, grain, makeTerrain, volumeAt } from './terrain.js'
import { evaluateEnding } from './endings.js'

const OBSERVATIONS = {
  rain: ['天空開始漏水。', '這次是實驗，不是忘了關水龍頭。'],
  pool: ['水往低處跑。', '山脈拒絕收件，海洋照單全收。'],
  evaporate: ['海面正在變矮。', '水只是換了一件看不見的外套。'],
  freeze: ['海洋按下暫停。', '現在可以溜冰，但先別問保險。'],
  melt: ['冬天開始撤退。', '冰塊沒有辭職，只是改回水的職位。'],
  desert: ['綠色正在放暑假。', '太陽表示：它沒有收到下班通知。'],
  erode: ['海岸又往後一步。', '海景第一排，正在變成海底第一排。'],
  fracture: ['山脈有點意見。', '溫差太大，地形決定分組報告。'],
  wind: ['雲開始散步。', '風沒有腳，卻把整片天空帶走了。'],
  cloud: ['太陽被請去休息。', '一床會移動的棉被，蓋住了山海。'],
  storm: ['海浪正在開會。', '雨和強風一碰面，會議就變成颱風。'],
  rainbow: ['天空換了七種顏色。', '這一次，魔法師沒有把顏料倒進海裡。'],
  lava: ['熱乎乎的地形來了。', '岩漿正沿山坡找自己的位置。'],
  steam: ['海水嘶了一聲。', '岩漿遇水，先冒蒸氣，再冷靜下來。'],
  basalt: ['這裡多了一塊新岩石。', '等它冷卻，就不再是會流動的地形了。'],
}
export const WORLD_VERSION = 2
export function createWorld() {
  const cells = makeTerrain()
  return {
    version: WORLD_VERSION, cells, seaMass: volumeAt(cells, WORLD.seaLevel), seaLevel: WORLD.seaLevel, seaGoal: WORLD.seaLevel,
    temperature: R.ambientTemperature, light: 45, input: null, particles: [], vapor: [],
    time: 0, tick: 0, random: WORLD.seed, serial: 0, emission: 0, vaporCredit: 0, cloudiness: .12,
    rainAdded: 0, snowAdded: 0, evaporated: 0, riseRate: 0, shock: 0, extreme: 0,
    lavaAdded: 0, wind: 0, storm: 0, windAngle: -.55, cloudOffset: 0, steamCredit: 0,
    rainMemory: 0, rainbow: 0, steamCreated: 0, basaltCreated: 0,
    doses: Object.fromEntries(POTIONS.map(p => [p.id, 0])),
    observations: [], observed: new Set(), ending: null, endingTimers: {},
    metrics: { moisture: .62, ice: 0, snow: 0, desert: 0, erosion: 0, damage: 0, lostLand: 0 },
  }
}
function random(model) {
  model.random = (Math.imul(1664525, model.random) + 1013904223) >>> 0
  return model.random / 4294967296
}
function observe(model, id) {
  if (model.observed.has(id)) return
  model.observed.add(id)
  model.observations.unshift({ id, title: OBSERVATIONS[id][0], text: OBSERVATIONS[id][1], time: model.time })
}
export function setInput(model, type, location = { x: WORLD.size / 2, y: WORLD.size / 2 }, strength = R.defaultStrength) {
  if (model.ending || !POTIONS.some(p => p.id === type)) return
  model.input = { type, x: clamp(location.x, 0, WORLD.size - 1), y: clamp(location.y, 0, WORLD.size - 1), strength: clamp(strength, .1, 1) }
}
export function stopInput(model) {
  model.input = null
  model.emission = 0 // No delayed dose or queued precipitation after release.
}
function climate(model, dt) {
  const type = model.input?.type
  const dose = model.input?.strength || 0
  if (type) model.doses[type] += dose * dt
  model.wind = clamp(model.wind + (type === 'wind' ? R.windGain * dose : -R.windDecay) * dt)
  model.cloudiness = clamp(model.cloudiness + (type === 'cloud' ? R.cloudGain * dose : type === 'rain' || type === 'cold' ? .06 * dose : -R.cloudDecay) * dt)
  model.cloudOffset += dt * model.wind * 25
  model.rainMemory = clamp(model.rainMemory + (type === 'rain' ? .1 * dose : -.005) * dt)
  model.storm += ((model.wind > .6 && model.rainMemory > .25 && model.cloudiness > .35 ? model.wind : 0) - model.storm) * dt * .6
  if (model.wind > .18) observe(model, 'wind')
  if (model.cloudiness > .35 && type === 'cloud') observe(model, 'cloud')
  if (model.storm > .3) observe(model, 'storm')
  const heat = (type === 'sun' ? R.sunHeat * (1 - model.cloudiness * .72) : type === 'cold' ? R.coldHeat : type === 'rain' ? R.rainCooling : type === 'lava' ? .4 : type === 'cloud' ? -.5 : 0) * dose
  model.temperature = clamp(model.temperature + heat * dt + (R.ambientTemperature - model.temperature) * R.climateReturn * dt, R.minTemperature, R.maxTemperature)
  const desiredLight = (type === 'sun' ? 100 : type === 'cold' ? 35 : type === 'rain' ? 40 : 55) * (1 - model.cloudiness * .7)
  model.light += (desiredLight - model.light) * dt * (type ? 1 : R.lightReturn)
  const naturalRainbow = model.rainMemory > .22 && model.light > 53 && model.cloudiness < .78
  model.rainbow = clamp(model.rainbow + (type === 'rainbow' ? R.rainbowGain * dose : naturalRainbow ? .055 : -R.rainbowDecay) * dt)
  if (model.rainbow > .18) observe(model, 'rainbow')
  const extreme = model.temperature >= 48 ? 1 : model.temperature <= -12 ? -1 : 0
  if (extreme && extreme !== model.extreme) {
    if (model.extreme) {
      model.shock = Math.min(1, model.shock + R.shockDamage)
      observe(model, 'fracture')
    }
    model.extreme = extreme
  }
}
function emit(model, dt) {
  const input = model.input
  if (!input || !['rain', 'cold', 'lava'].includes(input.type)) return
  const snow = input.type === 'cold'
  const lava = input.type === 'lava'
  model.emission = Math.min(8, model.emission + (snow ? R.snowRate : lava ? R.lavaRate : R.rainRate) * input.strength * dt)
  while (model.emission >= 1) {
    model.emission--
    if (model.particles.length >= R.maxParticles) continue
    const spread = () => (random(model) + random(model) - 1) * (lava ? 2.5 : R.brushRadius)
    const x = clamp(input.x + spread(), 0, WORLD.size - 1)
    const y = clamp(input.y + spread(), 0, WORLD.size - 1)
    const cell = model.cells[Math.floor(y) * WORLD.size + Math.floor(x)]
    model.particles.push({ x, y, z: Math.max(cell.height, model.seaLevel) + (lava ? 25 : 75) + random(model) * 40, type: snow ? 'snow' : lava ? 'lava' : 'rain', speed: .75 + random(model) * .5, id: ++model.serial, age: 0 })
    if (lava) { model.lavaAdded++; observe(model, 'lava') }
    else if (snow) model.snowAdded++
    else { model.rainAdded++; observe(model, 'rain') }
  }
}
function precipitation(model, dt) {
  const survivors = []
  for (const p of model.particles) {
    p.age += dt
    p.z -= (p.type === 'snow' ? R.snowSpeed : R.rainSpeed) * p.speed * dt
    if (p.type !== 'lava') {
      p.x = clamp(p.x + Math.cos(model.windAngle) * model.wind * dt * 5, 0, WORLD.size - 1)
      p.y = clamp(p.y + Math.sin(model.windAngle) * model.wind * dt * 5, 0, WORLD.size - 1)
    }
    if (p.type === 'snow') p.x = clamp(p.x + Math.sin(p.age * 4 + p.id) * dt * .6, 0, WORLD.size - 1)
    const c = model.cells[Math.floor(p.y) * WORLD.size + Math.floor(p.x)]
    if (p.z > Math.max(c.height, model.seaLevel) + c.pool * .025) { survivors.push(p); continue }
    const localTemperature = model.temperature - Math.max(0, c.height - WORLD.seaLevel) * R.mountainCooling + c.heat * 20
    if (p.type === 'lava') { c.lava = Math.min(100, c.lava + R.lavaMass); c.heat = Math.min(3, c.heat + .2) }
    else if (p.type === 'snow' && localTemperature < 2) c.snow += R.snowMass * .035
    else if (c.height <= model.seaLevel) model.seaMass += p.type === 'snow' ? R.snowMass : R.rainMass
    else {
      c.moisture = Math.min(1, c.moisture + R.rainMass * R.soak)
      c.pool += p.type === 'snow' ? R.snowMass : R.rainMass
    }
  }
  model.particles = survivors
}
function surface(model, dt) {
  const hot = Math.max(0, model.temperature - 22)
  const drying = R.groundEvaporation * hot / 3
  let land = 0, wet = 0, desert = 0, snow = 0, erosion = 0, damage = 0, lost = 0, seaCount = 0, seaIce = 0
  for (const c of model.cells) {
    const underwater = c.height <= model.seaLevel
    const localTemperature = model.temperature - (underwater ? 0 : Math.max(0, c.height - WORLD.seaLevel) * R.mountainCooling) + c.heat * 20
    const freezing = localTemperature < 0, melting = localTemperature > 2
    c.heat = Math.max(0, c.heat - dt * .13)
    if (c.lava > .001) {
      let downhill = null, lowest = Math.max(c.height, model.seaLevel) + c.lava * .2
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = c.x + dx, y = c.y + dy
        if (x < 0 || y < 0 || x >= WORLD.size || y >= WORLD.size) continue
        const next = model.cells[y * WORLD.size + x]
        const level = Math.max(next.height, model.seaLevel) + next.lava * .2
        if (level < lowest) { downhill = next; lowest = level }
      }
      if (downhill) {
        const flow = Math.min(c.lava, c.lava * R.lavaFlow * dt)
        c.lava -= flow; downhill.lava = Math.min(100, downhill.lava + flow); downhill.heat = Math.min(3, downhill.heat + flow * .025)
      }
      const contact = underwater || c.pool > 1
      const cooled = Math.min(c.lava, (contact ? R.lavaQuench : R.lavaCooling * (1 + model.wind) + (freezing ? 1.5 : 0)) * dt)
      c.lava -= cooled
      c.basalt = Math.min(12, c.basalt + cooled * .12)
      model.basaltCreated += cooled
      if (c.basalt > .3) observe(model, 'basalt')
      if (contact && cooled > 0) {
        observe(model, 'steam')
        model.steamCredit = Math.min(3, model.steamCredit + cooled * .35)
        while (model.steamCredit >= 1 && model.vapor.length < R.maxVapor) {
          model.steamCredit--
          model.vapor.push({ x: c.x, y: c.y, z: Math.max(c.height, model.seaLevel) + 2, age: 0, type: 'steam', id: ++model.serial })
          model.steamCreated++
        }
        c.pool = Math.max(0, c.pool - cooled)
      }
    }
    if (underwater) {
      seaCount++
      c.moisture = 1
      c.ice = clamp(c.ice + (freezing ? R.freezeRate * (1 + Math.abs(localTemperature) / 20) : -R.thawRate * Math.max(1, localTemperature / 12)) * dt)
      seaIce += c.ice
      if (c.ice > .12) observe(model, 'freeze')
      if (c.ice > .1 && melting) observe(model, 'melt')
    } else c.ice = Math.max(0, c.ice - dt * R.thawRate)
    if (c.pool > 0) {
      // Follow a terrain gradient; puddles stay where no lower neighbor exists.
      let next = null, lowest = c.height + c.pool * .025
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = c.x + dx, y = c.y + dy
        if (x < 0 || y < 0 || x >= WORLD.size || y >= WORLD.size) continue
        const neighbor = model.cells[y * WORLD.size + x]
        const level = Math.max(model.seaLevel, neighbor.height + neighbor.pool * .025)
        if (level < lowest) { lowest = level; next = neighbor }
      }
      if (next && !freezing) {
        const flow = Math.min(c.pool, c.pool * dt * R.runoff)
        c.pool -= flow
        if (next.height <= model.seaLevel) model.seaMass += flow
        else { next.pool += flow; next.moisture = Math.min(1, next.moisture + flow * .002) }
      }
      if (underwater) { model.seaMass += c.pool; c.pool = 0 }
      const evaporated = Math.min(c.pool, drying * dt * 30)
      c.pool -= evaporated
      model.evaporated += evaporated
    }
    c.moisture = clamp(c.moisture - drying * dt)
    if (c.snow > 0 && melting) {
      const melt = Math.min(c.snow, dt * R.snowMelt * (1 + localTemperature / 30))
      c.snow -= melt
      if (underwater) model.seaMass += melt / .035
      else { c.pool += melt / .035; c.moisture = Math.min(1, c.moisture + melt * .2) }
      observe(model, 'melt')
    }
    c.frost = clamp(c.frost + (localTemperature < -6 ? R.frostRate * (-localTemperature / 15) : -R.frostRate * Math.max(0, localTemperature / 10)) * dt)
    const dryTarget = !underwater && c.moisture < .3 && model.temperature > 30 ? 1 : 0
    c.desert = clamp(c.desert + (dryTarget ? .16 : -.08) * dt)
    // Soaked coasts slump slowly, even after the rain input has stopped.
    if (c.originalLand && c.height < model.seaLevel + 11 && c.height > model.seaLevel - 14 && c.moisture > .7 && model.seaLevel > WORLD.seaLevel + 3 && model.temperature > 2) {
      c.erosion = Math.min(30, c.erosion + R.erosionRate * dt * (.6 + grain(c.x, c.y)))
      if (c.erosion > 1) observe(model, 'erode')
    }
    c.damage += (clamp(model.shock * (.8 + grain(c.x + 4, c.y) * .4)) - c.damage) * dt * 1.8
    c.height = Math.max(1, c.initial + c.basalt - c.erosion - c.damage * 11)
    if (c.originalLand) {
      land++
      wet += c.moisture
      desert += c.desert
      snow += clamp(c.snow + c.frost)
      erosion += c.erosion
      damage += c.damage
      if (underwater) lost++
    }
  }
  const evaporated = Math.min(model.seaMass, R.seaEvaporation * Math.max(0, model.temperature - 20) / 15 * dt * (1 - seaIce / Math.max(1, seaCount)) * (1 + model.wind * .45))
  model.seaMass = Math.max(0, model.seaMass - evaporated)
  model.evaporated += evaporated
  model.vaporCredit += evaporated * .05
  if (evaporated > .2) observe(model, 'evaporate')
  while (model.vaporCredit >= 1) {
    model.vaporCredit--
    if (model.vapor.length >= R.maxVapor) continue
    const c = model.cells[Math.floor(random(model) * model.cells.length)]
    if (c.height > model.seaLevel) continue
    model.vapor.push({ x: c.x, y: c.y, z: model.seaLevel + 2, age: 0, id: ++model.serial })
  }
  model.vapor = model.vapor.filter(p => {
    p.age += dt; p.z += dt * (p.type === 'steam' ? 24 : 18)
    p.x = clamp(p.x + (Math.sin(p.age + p.id) * .3 + model.wind * 3) * dt, 0, WORLD.size - 1)
    return p.age < (p.type === 'steam' ? 5 : 4)
  })
  model.metrics = { moisture: wet / land, desert: desert / land, snow: snow / land, erosion: erosion / land, damage: damage / land, lostLand: lost / land, ice: seaIce / Math.max(1, seaCount) }
  if (model.metrics.desert > .2) observe(model, 'desert')
  if (model.seaLevel > WORLD.seaLevel + 1 || model.cells.some(c => c.pool > 15)) observe(model, 'pool')
}
export function stepWorld(model, dt = 1 / R.fps) {
  if (model.ending || !Number.isFinite(dt) || dt <= 0) return
  dt = Math.min(dt, 1 / R.fps)
  model.time += dt; model.tick++
  climate(model, dt)
  emit(model, dt)
  precipitation(model, dt)
  surface(model, dt)
  if (model.tick % 5 === 0) model.seaGoal = findSeaLevel(model.cells, model.seaMass)
  const before = model.seaLevel
  model.seaLevel += (model.seaGoal - model.seaLevel) * (1 - Math.exp(-dt * 4))
  model.riseRate += ((model.seaLevel - before) / dt - model.riseRate) * (1 - Math.exp(-dt * 1.4))
  evaluateEnding(model, dt)
}
export function snapshotWorld(model) {
  return { temperature: model.temperature, light: model.light, seaLevel: model.seaLevel, riseRate: model.riseRate, metrics: { ...model.metrics }, observations: [...model.observations], ending: model.ending, input: model.input?.type || null, particles: model.particles.length + model.vapor.length, rainAdded: model.rainAdded, snowAdded: model.snowAdded, lavaAdded: model.lavaAdded, wind: model.wind, storm: model.storm, cloudiness: model.cloudiness, rainbow: model.rainbow, steamCreated: model.steamCreated, basaltCreated: model.basaltCreated, doses: { ...model.doses }, time: model.time }
}
