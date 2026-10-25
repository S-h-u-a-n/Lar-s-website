// UI colours/bottles are intentionally shared with the saved prototype.
export { POTIONS } from '../config.js'
export const WORLD = { width: 840, height: 680, columns: 210, rows: 170, seed: 6307, seaY: .69 }
export const RULES = {
  fps: 30, uiEvery: .18, maxCatchUp: 3, defaultStrength: .45,
  minTemperature: -35, maxTemperature: 65, ambientTemperature: 18,
  climateReturn: .014, sunHeat: 4.2, coldHeat: -4.2,
  rainRate: 350, snowRate: 260, cloudRate: 110, lavaRate: 120,
  rainRadius: .34, snowRadius: .50, lavaRadius: 6,
  windGain: .16, windDecay: .012, cloudDecay: .006,
  evaporation: .003, condensation: .008, freeze: .10, thaw: .055,
  brushSpacing: 2, tapSeconds: .12, defaultBrush: 'medium',
  brushRadius: { rain: 5, cold: 7, lava: 6, cloud: 10, sun: 11, wind: 12, rainbow: 10 },
  brushDensity: { rain: .14, cold: .11, lava: .10, cloud: .10 },
  brushFlowPerCell: { rain: 3.2, cold: 1.9, lava: 1.6, cloud: .6 },
  lavaCooling: 650, erosion: .003, fracture: .0013,
  graceSeconds: 75, endingHold: 8,
}
export const BRUSH_SIZES = [
  { id: 'small', label: '小', scale: .34 },
  { id: 'medium', label: '中', scale: .60 },
  { id: 'large', label: '大', scale: 1.20 },
]
export const MATERIAL = { AIR: 0, SOIL: 1, ROCK: 2, WATER: 3, SNOW: 4, ICE: 5, LAVA: 6, STEAM: 7, CLOUD: 8 }
export const MATERIAL_NAMES = ['空氣', '土壤', '岩石', '水', '雪', '冰', '岩漿', '蒸氣', '雲']
export const PALETTE = {
  skyTop: [232, 240, 235], skyBottom: [253, 249, 238],
  soil: [158, 173, 132], drySoil: [216, 191, 142], wetSoil: [118, 150, 131],
  rock: [143, 156, 153], water: [117, 180, 201], snow: [239, 245, 239],
  ice: [176, 214, 224], lava: [231, 155, 105], steam: [192, 212, 211], cloud: [173, 194, 201],
}
