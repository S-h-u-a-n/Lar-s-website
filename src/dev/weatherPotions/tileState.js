import { grain, clamp } from './terrain.js'

export function tileState(cell, model) {
  const submerged = cell.height <= model.seaLevel
  let base = 'grass'
  if (cell.lava > .8) base = 'lava'
  else if (submerged) base = cell.ice > grain(cell.x, cell.y) * .75 + .12 ? 'ice' : 'water'
  else if (cell.basalt > .15) base = 'basalt'
  else if (cell.damage > .2 && grain(cell.x + 20, cell.y + 4) < cell.damage * .48) base = 'basalt'
  else if (cell.desert > .6 || cell.height < model.seaLevel + 2.2) base = 'sand'
  else if (cell.height > 38) base = 'rock'
  else if (cell.moisture < .25 || cell.desert > .18) base = 'dryGrass'
  else if (cell.erosion > 3 && cell.moisture > .75) base = 'soil'
  return {
    base, submerged,
    snow: base === 'ice' || base === 'lava' ? 0 : clamp(cell.snow + cell.frost),
    wet: !submerged && base !== 'lava' ? clamp(cell.pool / 35) : 0,
    shade: .04 + grain(cell.x, cell.y) * .10,
  }
}
