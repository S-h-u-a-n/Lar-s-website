export const RECOMMENDATIONS = [] // Future entries: { id, name, observation, description }

// Deliberate map locations; not recommendations or character-authored records.
export const RANDOM_LOCATIONS = [
  { id: 'taipei', name: '台北', longitude: 121.5654, latitude: 25.033, zoom: 10 },
  { id: 'greenwich', name: '格林威治', longitude: 0, latitude: 51.4779, zoom: 10 },
  { id: 'atacama', name: '阿塔卡馬', longitude: -68.21, latitude: -23.02, zoom: 9 },
  { id: 'kyoto', name: '京都', longitude: 135.7681, latitude: 35.0116, zoom: 10 },
  { id: 'reykjavik', name: '雷克雅維克', longitude: -21.9426, latitude: 64.1466, zoom: 9 },
  { id: 'great-wall-mutianyu', name: '慕田峪長城', longitude: 116.5704, latitude: 40.4319, zoom: 11 },
  { id: 'angkor-wat', name: '吳哥窟', longitude: 103.867, latitude: 13.4125, zoom: 12 },
  { id: 'taj-mahal', name: '泰姬瑪哈陵', longitude: 78.0421, latitude: 27.1751, zoom: 14 },
  { id: 'petra', name: '佩特拉古城', longitude: 35.4444, latitude: 30.3285, zoom: 13 },
  { id: 'mount-fuji', name: '富士山', longitude: 138.7274, latitude: 35.3606, zoom: 10 },
  { id: 'ha-long-bay', name: '下龍灣', longitude: 107.1839, latitude: 20.9101, zoom: 10 },
  { id: 'giza-pyramids', name: '吉薩金字塔群', longitude: 31.1342, latitude: 29.9792, zoom: 13 },
  { id: 'victoria-falls', name: '維多利亞瀑布', longitude: 25.8572, latitude: -17.9243, zoom: 12 },
  { id: 'table-mountain', name: '桌山', longitude: 18.4098, latitude: -33.9628, zoom: 11 },
  { id: 'lalibela', name: '拉利貝拉岩石教堂', longitude: 39.0411, latitude: 12.0319, zoom: 14 },
  { id: 'colosseum', name: '羅馬競技場', longitude: 12.4922, latitude: 41.8902, zoom: 15 },
  { id: 'eiffel-tower', name: '艾菲爾鐵塔', longitude: 2.2945, latitude: 48.8584, zoom: 15 },
  { id: 'meteora', name: '梅黛奧拉修道院', longitude: 21.6306, latitude: 39.7217, zoom: 12 },
  { id: 'giants-causeway', name: '巨人堤道', longitude: -6.5116, latitude: 55.2408, zoom: 13 },
  { id: 'santorini', name: '聖托里尼島', longitude: 25.4615, latitude: 36.3932, zoom: 12 },
  { id: 'grand-canyon', name: '大峽谷', longitude: -112.1129, latitude: 36.1069, zoom: 10 },
  { id: 'yellowstone-old-faithful', name: '黃石國家公園・老忠實泉', longitude: -110.8281, latitude: 44.4605, zoom: 12 },
  { id: 'machu-picchu', name: '馬丘比丘', longitude: -72.545, latitude: -13.1631, zoom: 14 },
  { id: 'iguazu-falls', name: '伊瓜蘇瀑布', longitude: -54.4367, latitude: -25.6953, zoom: 12 },
  { id: 'salar-de-uyuni', name: '烏尤尼鹽沼', longitude: -67.4891, latitude: -20.1338, zoom: 9 },
  { id: 'christ-the-redeemer', name: '里約熱內盧基督像', longitude: -43.2105, latitude: -22.9519, zoom: 13 },
  { id: 'uluru', name: '烏魯魯', longitude: 131.0369, latitude: -25.3444, zoom: 11 },
  { id: 'sydney-opera-house', name: '雪梨歌劇院', longitude: 151.2153, latitude: -33.8568, zoom: 15 },
  { id: 'milford-sound', name: '米爾福德峽灣', longitude: 167.925, latitude: -44.671, zoom: 11 },
  { id: 'great-barrier-reef', name: '大堡礁・心形礁', longitude: 147.6992, latitude: -18.2871, zoom: 12 },
]

export function validObservation(value) {
  return value && Number.isFinite(value.longitude) && Number.isFinite(value.latitude)
    && Math.abs(value.longitude) <= 180 && Math.abs(value.latitude) <= 90
    && ['zoom', 'bearing', 'pitch', 'roll'].every(field => value[field] === undefined || Number.isFinite(value[field]))
    && (value.mode === undefined || ['globe', 'satellite'].includes(value.mode))
}
export function sameObservation(a, b) {
  if ((a.mode || 'globe') !== (b.mode || 'globe')) return false
  const angularDistance = (x, y) => Math.abs(((x - y + 180) % 360 + 360) % 360 - 180)
  // MapLibre's camera round-trip introduces small floating-point differences.
  return angularDistance(a.longitude, b.longitude) < .00001 && Math.abs(a.latitude - b.latitude) < .00001
    && Math.abs((a.zoom ?? 12) - (b.zoom ?? 12)) < .001
    && angularDistance(a.bearing ?? 0, b.bearing ?? 0) < .005
    && Math.abs((a.pitch ?? (a.mode === 'satellite' ? 70 : 0)) - (b.pitch ?? (b.mode === 'satellite' ? 70 : 0))) < .005
    && angularDistance(a.roll ?? 0, b.roll ?? 0) < .005
}
export function readObservations(storage, key) {
  try {
    const items = JSON.parse(storage.getItem(key) || '[]')
    if (!Array.isArray(items) || items.some(item => !validObservation(item) || typeof item.name !== 'string' || typeof item.id !== 'string')) throw new Error('Unknown collection format')
    return { items, readable: true }
  } catch { return { items: [], readable: false } }
}
