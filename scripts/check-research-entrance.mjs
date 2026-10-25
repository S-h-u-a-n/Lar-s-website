// Exercise the real camera/entrance hooks with deterministic frames and DOM sizes.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
const data = await readFile(new URL('../src/components/naturalTest/data.js', import.meta.url), 'utf8')
const CAMERA = vm.runInNewContext(`(${data.match(/export const CAMERA = (\{[^\n]+\})/)[1]})`)
const config = await readFile(new URL('../src/components/bigTest/config.js', import.meta.url), 'utf8')
const motion = vm.runInNewContext(`(${config.match(/export const MOTION = (\{[^\n]+\})/)[1]})`)
const cameraSource = (await readFile(new URL('../src/components/naturalTest/useResearchCamera.js', import.meta.url), 'utf8')).replace(/^import .*$/gm, '').replace('export default function', 'function')
const entranceSource = (await readFile(new URL('../src/components/naturalTest/useResearchEntrance.js', import.meta.url), 'utf8')).replace(/^import .*$/gm, '').replace('export const', 'const').replace('export default function', 'function')
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`)
function harness(reduced = false) {
  let now = 0, sequence = 0
  const frames = new Map(), effects = [], refs = []
  const viewport = { clientWidth: 320, clientHeight: 600, style: { setProperty() {} }, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [] }
  const world = { style: {} }
  let observer
  const context = vm.createContext({ CAMERA, STYLE: { motion },
    useCallback: callback => callback,
    useRef: value => { const ref = { current: value }; refs.push(ref); return ref },
    useState: value => [value, () => {}],
    useLayoutEffect: callback => effects.push(callback), useEffect: callback => effects.push(callback),
    performance: { now: () => now },
    requestAnimationFrame: callback => { const id = ++sequence; frames.set(id, callback); return id },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: () => assert.fail('Reduced-motion entrance must not wait'), clearTimeout() {},
    window: { matchMedia: () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }), addEventListener() {}, removeEventListener() {} },
    ResizeObserver: class { constructor(callback) { observer = callback } observe() {} disconnect() {} },
  })
  vm.runInContext(`${cameraSource}\n${entranceSource}`, context)
  const camera = context.useResearchCamera({ x: 180, y: 120, width: 3450, height: 1920 })
  refs[0].current = viewport; refs[1].current = world
  const cleanup = effects[0]()
  const tick = delta => { now += delta; const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)) }
  return { context, camera, tick, effects, observer: () => observer(), cleanup }
}
const h = harness()
near(h.camera.snapshot().scale, (320 - 110) / 3450) // Whole canvas fits below legacy minScale.
let completed = 0
h.camera.locate({ x: 600, y: 500 }, .6, .5, { duration: 1500, onComplete: () => completed++ })
h.tick(500)
const midway = h.camera.snapshot()
h.camera.interrupt()
near(h.camera.snapshot().scale, midway.scale)
near(h.camera.snapshot().x, midway.x)
h.tick(2000)
assert.equal(completed, 0, 'Cancelled focus cannot complete later')
h.camera.zoom(.8)
near(h.camera.snapshot().scale, midway.scale)
h.tick(motion.duration)
near(h.camera.snapshot().scale, midway.scale * .8)
h.camera.locate({ x: 600, y: 500 }, .6, .5, { duration: 1500, onComplete: () => completed++ })
h.tick(1499); assert.equal(completed, 0)
h.tick(1); assert.equal(completed, 1)
near(h.camera.snapshot().x, 600); near(h.camera.snapshot().y, 500)
const final = h.camera.snapshot()
h.tick(2000); near(h.camera.snapshot().scale, final.scale)
h.cleanup()
const r = harness(true)
r.context.useResearchEntrance(r.camera, { id: 'land', x: 180, y: 260, width: 900, height: 650 }, true)
const entranceEffect = r.effects[1]
const stopEntrance = entranceEffect()
assert.equal(r.camera.snapshot().intent.type, 'point')
stopEntrance()
r.camera.overview(false) // StrictMode replays camera mount before entrance mount.
entranceEffect()
assert.equal(r.camera.snapshot().intent.type, 'point', 'Reduced motion survives StrictMode effect replay')
console.log('Research entrance checks passed: overview fit, camera interruption, continuous zoom takeover, duration/completion, stable final view, reduced-motion StrictMode replay.')
