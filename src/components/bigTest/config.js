import { PIGMENTS } from '../../edition/palette'
// Coordinates use the reference's 2048 × 1170 artboard. Images remain proportional.
export const ARTBOARD = { width: 2048, height: 1170 }
export const GEOMETRY = [
  { id: 'title', x: 0, y: 0, width: 2048, height: 72, color: PIGMENTS.mint, z: 3 },
  { id: 'left-yellow', x: 96, y: 765, width: 102, height: 102, rotation: 46, color: PIGMENTS.butter },
  { id: 'left-blue', x: 255, y: 982, width: 170, height: 170, rotation: -42, color: PIGMENTS.sky },
  { id: 'left-stripes', x: -72, y: 925, width: 315, height: 315, rotation: -12, color: PIGMENTS.strawberry, pattern: 'stripes', spacing: 61, thickness: 10, patternColor: PIGMENTS.white, angle: 48 },
  { id: 'right-stripes', x: 1940, y: 806, width: 220, height: 275, rotation: 2, color: PIGMENTS.butter, pattern: 'stripes', spacing: 43, thickness: 7, patternColor: PIGMENTS.white, angle: -45 },
  { id: 'right-teal', x: 1694, y: 915, width: 365, height: 365, rotation: 47, color: PIGMENTS.mint, z: 2 },
  { id: 'bottom-peach', x: 1484, y: 1105, width: 102, height: 170, rotation: 18, color: PIGMENTS.peach },
]
export const MOTION = { duration: 420, dotsDelay: 90, textDelay: 160, easing: 'cubic-bezier(.22,.75,.25,1)' }
export const MAINTENANCE = [
  { id: 'globe', name: 'Globe', color: PIGMENTS.strawberry },
  { id: 'telescope', name: 'Telescope', color: PIGMENTS.peach },
  { id: 'book-open1', name: 'Open Book', color: PIGMENTS.butter },
  { id: 'book-close1', name: 'Closed Book', color: PIGMENTS.sky },
  { id: 'ball', name: 'Crystal Ball', color: PIGMENTS.mint },
  { id: 'potion', name: 'Magic Potion', color: '#e1d0f2' },
]
export const DOCUMENTS = [
  { id: 'letter', name: 'Letter', hoverColor: PIGMENTS.mint },
  { id: 'diary', name: 'Diary', title: 'Laboratory Diary', body: 'A record of quiet discoveries, unusual experiments and the small mysteries of everyday life. This space is reserved for the official diary entries and their illustrations.', hoverColor: PIGMENTS.strawberry },
  { id: 'notes', name: 'Notes', title: 'Research Notes', body: 'Observations from the worktable. Future notes, diagrams and sketches will be collected here. For now, take a moment to explore the objects in the laboratory.', hoverColor: PIGMENTS.sky },
]
// Hit regions for the already-rendered corner geometry, not the model's Big-squares.
// Keep the former text IDs so the user's saved hover-label settings carry over.
export const DOCUMENT_ENTRANCES = [
  { shapeId: 'left-stripes', document: 'letter', textId: 'square-pink-bottom' },
  { shapeId: 'left-blue', document: 'diary', textId: 'square-teal-bottom' },
  { shapeId: 'right-teal', document: 'notes', textId: 'square-yellow-top' },
]
// Crops of the existing Big-squares image, including its original overlap order.
export const SQUARES = [
  { id: 'pink-top', x: 700, y: 262, width: 66, height: 66, document: 'letter' },
  { id: 'yellow-top', x: 759, y: 226, width: 45, height: 44, document: 'notes' },
  { id: 'blue-top', x: 765, y: 327, width: 66, height: 65, document: 'diary' },
  { id: 'blue-left', x: 508, y: 649, width: 64, height: 66, document: 'notes' },
  { id: 'peach-left', x: 553, y: 696, width: 44, height: 44, document: 'letter' },
  { id: 'peach-right', x: 1475, y: 487, width: 34, height: 34, document: 'letter' },
  { id: 'yellow-right', x: 1474, y: 585, width: 66, height: 65, document: 'notes' },
  { id: 'teal-right', x: 1451, y: 636, width: 35, height: 37, document: 'diary' },
  { id: 'teal-bottom', x: 1218, y: 1036, width: 64, height: 66, document: 'diary' },
  { id: 'pink-bottom', x: 1282, y: 973, width: 64, height: 64, document: 'letter' },
]
export const PATTERN_DEFAULTS = { spacing: 16, thickness: 2, color: PIGMENTS.mint, angle: 45 }
export const PANEL_PATTERN = { pattern: 'dots', spacing: 17, thickness: 2, patternColor: PIGMENTS.mint }
export const FLOATING = { durations: [6.2, 7.4, 5.6, 8, 6.8, 4.9, 7.8, 6, 7.1, 5.3], amplitudeY: 'clamp(2px, .3cqw, 6px)', amplitudeX: 'clamp(.5px, .08cqw, 1.6px)' }
export function floatingStyle(index) {
  return { '--bt-float-duration': `${FLOATING.durations[index % FLOATING.durations.length]}s`, '--bt-float-delay': `${-index * 1.37}s`, '--bt-float-y': FLOATING.amplitudeY, '--bt-float-x': FLOATING.amplitudeX }
}

// Documents float around their original layout anchor; decorative squares retain their own motion.
export function documentFloatingStyle(index) {
  return { ...floatingStyle(index), '--bt-float-y': 'clamp(1px, .12cqw, 2px)', '--bt-float-x': '.5px' }
}

// Timing/easing come from the camera's actual animation progress (900ms cubic-out,
// 1400ms smoothstep return), including interrupted transitions; no second clock.
export const FOCUS_MOTION = {
  grid: { shift: '-12%', scale: 1.1, origin: '50% 50%' },
  squares: { shift: '-12%', scale: 1.1, origin: '50% 50%' },
  round: { shift: '-12%', scale: 1.1, origin: '50% 50%' },
}
export function focusStyle(group) {
  const motion = FOCUS_MOTION[group]
  return { '--bt-focus-shift': motion.shift, '--bt-focus-growth': motion.scale - 1, transformOrigin: motion.origin }
}
