// UI colours/bottles are intentionally shared with the saved prototype.
import { POTIONS as ORIGINAL_POTIONS } from '../config.js'
export const POTIONS = [...ORIGINAL_POTIONS,
  { id: 'growth', name: '生長', english: 'Growth', color: '#8DB879', number: '08', mark: 'growth', note: '水、光和溫度都很重要（！）' },
  { id: 'sand', name: '砂子', english: 'Sand', color: '#DFBF83', number: '09', mark: 'sand', note: '就是！砂子！' },
]
export const WORLD = { width: 840, height: 680, columns: 210, rows: 170, seed: 6307, seaY: .69 }
export const RULES = {
  fps: 30, uiEvery: .18, maxCatchUp: 3, defaultStrength: .45,
  minTemperature: -35, maxTemperature: 65, ambientTemperature: 18,
  upperAirCooling: 20,
  climateReturn: .014, sunHeat: 4.2, coldHeat: -4.2,
  rainRate: 350, snowRate: 260, cloudRate: 110, lavaRate: 120,
  growthMaxParticles: 600, growthLifetime: 12, growthActivationRadius: 4,
  sandRate: 100, growthRate: 12, sandRadius: 6, growthRadius: 6,
  plantMaxCells: 1200, plantMaxDepth: 14, plantSpread: 6, plantGrowthChance: .025,
  plantBloomDelay: 8,
  plantStressLimit: 9, sandSinterTemperature: 120, sandSinterTicks: 90,
  rainRadius: .34, snowRadius: .50, lavaRadius: 6,
  windGain: .16, windDecay: .012, cloudDecay: .006,
  magicSnowSettleGrace: 6, magicSnowThawScale: .08,
  precipitationMixBand: 1, localThermalSeconds: 4,
  evaporation: .003, condensation: .008, freeze: .10, thaw: .055,
  cloudMaxParticles: 600, cloudMaxFraction: .02, cloudRainMinAge: 300,
  cloudRainChance: .005, cloudStormRainChance: .006,
  lavaHeatRadius: 3, lavaHeatBoost: 72, lavaHeatTransfer: .035,
  surfaceRefreshTicks: 6, slopeScale: 4, erosionSlopeGain: .75,
  erosionStormGain: .4, erosionRainGain: .3, erosionExposureSlopeGain: .5,
  sandWaterTransportChance: .1, sandSlopeTransportGain: .65, windSoilDrying: .00008,
  brushSpacing: 2, tapSeconds: .12, defaultBrush: 'medium',
  brushRadius: { rain: 5, cold: 7, lava: 6, cloud: 10, sun: 11, wind: 12, rainbow: 10, growth: 7, sand: 6 },
  brushDensity: { rain: .14, cold: .11, lava: .10, cloud: .10, growth: .05, sand: .12 },
  brushFlowPerCell: { rain: 3.2, cold: 1.9, lava: 1.6, cloud: .6, growth: .35, sand: 2.2 },
  lavaCooling: 650, erosion: .003, fracture: .0013,
  graceSeconds: 75, endingHold: 8,
}
export const BRUSH_SIZES = [
  { id: 'small', label: '小', scale: .34 },
  { id: 'medium', label: '中', scale: .60 },
  { id: 'large', label: '大', scale: 1.20 },
]
export const MATERIAL = { AIR: 0, SOIL: 1, ROCK: 2, WATER: 3, SNOW: 4, ICE: 5, LAVA: 6, STEAM: 7, CLOUD: 8, SAND: 9, PLANT: 10, GROWTH: 11 }
export const MATERIAL_NAMES = ['空氣', '土壤', '岩石', '水', '雪', '冰', '岩漿', '蒸氣', '雲', '砂子', '植物', '生長粒子']
// Material pigments derived from edition/palette.js; only Canvas colours.
export const PALETTE = {
  growth: [184, 217, 147], sand: [241, 220, 169], plant: [131, 179, 149], wilted: [195, 177, 142],
  flowers: [[241, 154, 181], [184, 158, 219], [250, 193, 133]], flowerCenter: [255, 239, 158],
  skyTop: [230, 245, 243], skyBottom: [253, 249, 238],
  soil: [174, 197, 175], drySoil: [232, 213, 174], wetSoil: [136, 180, 173],
  rock: [166, 186, 196], water: [131, 199, 222], snow: [255, 254, 248],
  ice: [200, 233, 231], lava: [242, 167, 153], steam: [229, 238, 234], cloud: [242, 240, 231],
  sunshine: '#F6F0A9',
  rainbow: ['#FFD0DB', '#FFDBCA', '#F6F0A9', '#B8D6B3', '#A2D8DE', '#7FB9EC', '#E5DDF5'],
}
