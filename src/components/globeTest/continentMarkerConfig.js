// radius, globalSurfaceOffset and each marker's additive surfaceOffset are
// fractions of the actual Earth radius. Offset uses Earth-mesh local axes,
// also relative to Earth radius. Changing radius never moves the center.
// Add an optional final object to a row for individual overrides, e.g.
// { radius: 0.03, surfaceOffset: 0.005 }.
export const MARKER_DEFAULTS = {
  radius: 0.05, globalSurfaceOffset: 0.065, hitRadiusScale: 1.25,
  outlineWidthRatio: 0.68, // Outer radius: 1.12 × 1.5 = 1.68; inner radius stays 1.
  hover: { scale: 1.12, durationMs: 150 },
}
export const CONTINENT_MARKERS = [
  ['asia', '亞洲', 'Asia', 100, 40, '#FF8398'],
  ['europe', '歐洲', 'Europe', 20, 50, '#70C9E8'],
  ['africa', '非洲', 'Africa', 20, 8, '#FFC46B'],
  ['north-america', '北美洲', 'North America', -105, 45, '#A5D98C'],
  ['south-america', '南美洲', 'South America', -55, -15, '#D3A6F5'],
  ['oceania', '大洋洲', 'Oceania', 135, -25, '#53D4CE'],
  ['antarctica', '南極洲', 'Antarctica', 30, -78, '#91B8FF'],
].map(([id, nameZh, nameEn, longitude, latitude, color, overrides = {}]) => ({
  id, nameZh, nameEn, longitude, latitude, color,
  offset: [0, 0, 0], surfaceOffset: 0,
  radius: MARKER_DEFAULTS.radius, hover: { ...MARKER_DEFAULTS.hover },
  ...overrides,
}))
