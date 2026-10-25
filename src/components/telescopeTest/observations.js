export const RECOMMENDATIONS = [] // Future entries: { id, name, observation, description }

// Deliberate map locations; not recommendations or character-authored records.
export const RANDOM_LOCATIONS = [
  { id: 'taipei', name: '台北', longitude: 121.5654, latitude: 25.033, zoom: 10 },
  { id: 'greenwich', name: '格林威治', longitude: 0, latitude: 51.4779, zoom: 10 },
  { id: 'atacama', name: '阿塔卡馬', longitude: -68.21, latitude: -23.02, zoom: 9 },
  { id: 'kyoto', name: '京都', longitude: 135.7681, latitude: 35.0116, zoom: 10 },
  { id: 'reykjavik', name: '雷克雅維克', longitude: -21.9426, latitude: 64.1466, zoom: 9 },
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
