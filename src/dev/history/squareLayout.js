export function seeded(seed) {
  let value = seed >>> 0
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296 }
}
export const smooth = t => t * t * (3 - 2 * t)
// Same ellipse/soft boundary as IntroSquares. History uses fixed reference-space
// anchors instead of random respawning, so re-renders/resize never rearrange art.
export function avoidTitle(x, y, radius, box) {
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2
  const ax = box.width / 2 + radius * Math.SQRT2 + 30
  const ay = box.height / 2 + radius * Math.SQRT2 + 26
  const distance = Math.hypot((x - cx) / ax, (y - cy) / ay)
  if (distance < .0001) return { x: cx, y: cy - ay * 1.02 }
  const band = .14, safe = 1 + band * Math.log1p(Math.exp(Math.min(50, (distance - 1) / band)))
  const factor = distance > 3 ? 1 : safe / distance
  return { x: cx + (x - cx) * factor, y: cy + (y - cy) * factor }
}
export function squareLayout(settings, width, height, sourceCount) {
  const random = seeded(settings.seed), range = (lo, hi) => lo + random() * (hi - lo)
  const columns = Math.ceil(settings.count / 3)
  return Array.from({ length: settings.count }, (_, i) => {
    const sizeRoll = random(), size = sizeRoll < .45 ? range(12,25) : sizeRoll < .85 ? range(28,50) : range(55,80)
    return { id: i, src: i % sourceCount,
      x: (Math.floor(i / 3) + range(.23,.77)) / columns * width,
      y: ([.17,.44,.77][i % 3] + range(-.045,.045)) * height,
      size, dx: range(-40,40), dy: -range(70,160), sway: range(3,9),
      angle: range(-8,8), turn: range(-5,5), phase: range(0,Math.PI*2),
      duration: range(settings.durationMin,settings.durationMax), phaseTime: range(0,settings.durationMin),
      opacity: random() < .85 ? 1 : .8 }
  })
}
export function squarePose(p, elapsed, baselineScale) {
  const t = ((elapsed + p.phaseTime) % p.duration) / p.duration
  return { x: p.x + (p.dx * t + Math.sin(t*Math.PI*2+p.phase)*p.sway) / baselineScale,
    y: p.y + p.dy * t / baselineScale,
    angle: p.angle + p.turn * Math.sin(t*Math.PI),
    opacity: p.opacity * smooth(Math.min(1,t/.12)) * smooth(Math.min(1,(1-t)/.10)) }
}
