import { PIGMENTS } from '../../edition/palette.js'

export const WORLD = { size: 52, width: 840, height: 680, tileWidth: 13, tileDepth: 6.6, heightScale: 2.35, originY: 215, seaLevel: 12, floor: -8, seed: 6307 }
export const RULES = {
  fps: 30, uiEvery: .15, maxCatchUp: 3, maxParticles: 320, maxVapor: 100,
  minTemperature: -35, maxTemperature: 65, ambientTemperature: 18, climateReturn: .018,
  rainRate: 150, snowRate: 95, rainMass: 5, snowMass: 4, brushRadius: 19,
  rainSpeed: 170, snowSpeed: 70, sunHeat: 4, coldHeat: -4, rainCooling: -.18,
  seaEvaporation: 100, groundEvaporation: .0015, erosionRate: .085,
  freezeRate: .045, thawRate: .09, frostRate: .035, lightReturn: .04,
  snowMelt: .4, runoff: 2.5, soak: .014, shockDamage: .18,
  defaultStrength: .45, mountainCooling: .28,
  windGain: .14, windDecay: .022, cloudGain: .18, cloudDecay: .009,
  lavaRate: 32, lavaMass: 4, lavaFlow: 1.7, lavaCooling: .3, lavaQuench: 5,
  rainbowGain: .28, rainbowDecay: .018,
}
export const POTIONS = [
  { id: 'rain', name: '雨水', english: 'A little rain', color: PIGMENTS.sky, number: '01', mark: 'drop', note: '稍微濕潤一下。對，「稍微」。' },
  { id: 'sun', name: '陽光', english: 'Borrowed sunshine', color: PIGMENTS.butter, number: '02', mark: 'sun', note: '借一點太陽。記得還。' },
  { id: 'cold', name: '寒冷', english: 'Winter, bottled', color: PIGMENTS.mint, number: '03', mark: 'snow', note: '冬天很安靜，冰箱也是。' },
  { id: 'wind', name: '風', english: 'A bottled breeze', color: PIGMENTS.peach, number: '04', mark: 'wind', note: '讓雲散散步，海浪順便伸懶腰。' },
  { id: 'cloud', name: '多雲', english: 'A little overcast', color: PIGMENTS.lavender, number: '05', mark: 'cloud', note: '替太陽蓋一條不太聽話的棉被。' },
  { id: 'lava', name: '岩漿', english: 'Warm earth', color: PIGMENTS.strawberry, number: '06', mark: 'lava', note: '倒在海邊看看。小心，這不是番茄湯。' },
  { id: 'rainbow', name: '彩虹', english: 'A change of colour', color: '#D8DBA9', number: '07', mark: 'rainbow', note: '雨後借一道光，也可以直接借七道。' },
]
export const ENDING_RULES = {
  graceSeconds: 60,
  noah: { seaLevel: 42, lostLand: .88, riseRate: .15, seconds: 10 },
  atlantis: { erosion: 4.2, lostLand: .70, riseRate: .15, seconds: 12 },
  ice: { temperature: -22, ice: .96, snow: .94, seconds: 12 },
  sahara: { temperature: 55, desert: .92, moisture: .08, seconds: 12 },
  apocalypse: { damage: .86, seconds: 5 },
}
export const COLORS = {
  water: ['#5296b5', '#62a6c3', '#76b4cf', '#8cc9da', '#a2d8de'],
  land: ['#719783', '#80a48b', '#92b299', '#a6bda0'],
  rock: ['#75888b', '#8e9a99', '#a4aaa1', '#b8b9a9'],
  sand: ['#d4b98b', '#dfc99c', '#edd9ad', '#f1e4bf'],
  ice: ['#aaceda', '#bfdae5', '#d8e9ed', '#eff5ed'],
  snow: ['#dae7e9', '#ebf0e9', '#fffef8'],
  side: ['#536878', '#6b7e83', '#869087'], rain: '#7fb9ec', vapor: '#a2d8de', crack: '#34465a',
}
