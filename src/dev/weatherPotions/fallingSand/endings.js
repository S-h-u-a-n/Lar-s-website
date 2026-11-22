import { RULES as R } from './config.js'
export { ENDINGS } from '../endings.js'
export function evaluateEnding(world, dt) {
  const m = world.metrics
  const conditions = {
    apocalypse: m.damage > .52 && world.disasters.size >= 2,
    noah: m.floodedLand > .62 && m.flood > .23 && (world.riseRate > .035 || world.seaLevel > 98) && m.ice < .25 && m.damage < .35,
    ice: world.temperature < -22 && m.ice > .88 && m.snow > .20,
    sahara: world.temperature > 50 && m.desert > .86 && m.moisture < .12 && m.liquidRemaining < .20,
    atlantis: m.permanentLandLoss > .18 && m.erosion > .025 && world.riseRate < .025 && m.ice < .3 && m.damage < .35,
  }
  for (const id of ['apocalypse', 'noah', 'ice', 'sahara', 'atlantis']) {
    world.endingTimers[id] = world.time >= R.graceSeconds && conditions[id] ? (world.endingTimers[id] || 0) + dt : 0
    if (world.endingTimers[id] >= R.endingHold) { world.ending = id; world.input = null; world.emission = 0; return id }
  }
  return null
}
