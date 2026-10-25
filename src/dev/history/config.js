import placements from './placements.json'
import interactionGeometry from './interactionGeometry.json'

// All geometry uses the reference's 12524 × 2620 coordinate system.
export const HISTORY = {
  width: 12524,
  height: 2620,
  background: '#ffffff',
  title: { x: 260, y: 320, width: 1800, fontSize: 310, color: '#681b0b' },
  // Formal entry proportions: 3.7vw/7.5vw, 4px/113.4px at 1512px viewport.
  titlePlayback: { preRatio: 3.7 / 7.5, lineGapEm: 4 / 113.4, headingEm: 3.7 / 7.5 + 4 / 113.4 + 1.1, preloadMargin: 300 },
  squares: { count: 30, seed: 731, opacity: 0.45, durationMin: 14000, durationMax: 22000, referenceViewportHeight: 805, overscan: 96, reducedCount: 10 },
  scroll: { gain: 1, linePixels: 16 },
  // Maximum additional offset in CSS pixels, independent of panorama length.
  parallax: { 'layer-1': 30, 'layer-2': 18, 'layer-3': 6 },
  parallaxDynamics: { velocityScale: 1200, velocitySmoothing: 0.12, stiffness: 100, damping: 20, settle: 0.0001, edgeFade: 60 },
  shadow: { x: 0, y: 5, blur: 8, color: 'rgba(60, 39, 30, 0.16)' },
  entrance: {
    map: { delay: 0, duration: 620, fromY: 240, overshoot: 0.65 },
    people: { delay: 140, duration: 720, fromY: 300, overshoot: 0.65 },
    layer: { delay: 260, duration: 500, stagger: 120 },
  },
  arrow: { left: 22, top: '46%', size: 32, travel: 3, cycleMs: 1800, fadeMs: 300 },
  hover: { scale: 1.10, scaleStiffness: 95, scaleDamping: 20, push: 26, stiffness: 78, damping: 16, maxAngle: 6, maxTilt: 3, scrollQuietMs: 140, cooldownMs: 300 },
  entryHint: { fontSize: 72, gap: 45, fadeMs: 400 },
  entryGesture: { quietMs: 650, dwellMs: 650, gestureWindowMs: 400, thresholdPx: 60 },
  motion: { stiffness: 72, damping: 13, impulse: 0.0385, maxAngle: 3.675, verticalAngle: 0.65, pointerGain: 0.35 },
}
export const ASSETS = placements.map(item => ({ ...item,
  interaction: interactionGeometry[item.id],
  origin: interactionGeometry[item.id]?.foot || item.origin,
  src: new URL(`../../../Art/IntroScreen/history/${item.id}.PNG`, import.meta.url).href,
  z: item.id.startsWith('layer') ? 4 - Number(item.id.split('-')[1]) : item.id.startsWith('map') ? 10 : 20,
}))
