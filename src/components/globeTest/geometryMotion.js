// Gains multiply useParallax's existing smoothed, normalized full-page pointer.
// Keep the circle's own 4px gain unchanged; rectangles have varied depth.
export function geometryPointerGain(index) {
  return {
    x: (index % 2 ? -1 : 1) * (4 + index % 4 * 1.5),
    y: (index % 3 === 0 ? -1 : 1) * (3 + index % 3 * 1.2),
  }
}

export function geometryFloat(seconds, index) {
  const phase = index * 1.73
  return {
    x: Math.sin(seconds * Math.PI * 2 / (15 + index * 1.7) + phase) * (5 + index % 3),
    y: Math.cos(seconds * Math.PI * 2 / (19 + index * 1.3) + phase) * (6 + index % 2),
  }
}
