import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// Exercise the production render callback without WebGL, including its async
// preparation boundary. Geometry/framing stays in Three.js unchanged.
const source = readFileSync(new URL('../MainScene.jsx', import.meta.url), 'utf8')
const renderSource = source.slice(source.indexOf('    const render = now => {'), source.indexOf('    const observer = new ResizeObserver(resize)'))
function mount(width, height) {
  const events = []
  const context = {
    disposed: false, failed: false, readyToPresent: false,
    host: { clientWidth: width, clientHeight: height },
    resize: () => events.push('measure'),
    requestAnimationFrame: () => { events.push('schedule'); return 1 },
    frame: 0, previousTime: 0, elapsed: 0, toolReactions: [],
    miniCosmos: null, focusAnimation: null, transitionHandoff: null,
    controls: { update: () => events.push('controls'), target: { clone: () => 'current target' } },
    camera: { position: { clone: () => 'current camera' } }, scene: {},
    updateCosmosBillboard: () => events.push('billboard'),
    initialView: { near: 1, far: 1000 },
    renderer: { render: () => events.push('draw') },
    readiness: { pending: true, complete() { this.pending = false; events.push('present') }, fail(error) { throw error } },
    reportFailure: error => { throw error },
  }
  vm.createContext(context)
  vm.runInContext(`${renderSource.replaceAll('import.meta.env.DEV', 'false')}\nglobalThis.renderFrame = render`, context)
  return { context, events, frame: () => context.renderFrame(100) }
}

for (const [width, height] of [[1920, 1080], [1440, 900], [2560, 1080], [1024, 768]]) {
  test(`first frame waits for preparation and current viewport: ${width}x${height}`, () => {
    // A fresh mount also represents refresh, page re-entry, and model retry.
    for (let entry = 0; entry < 3; entry++) {
      const { context, events, frame } = mount(width, height)
      frame()
      frame()
      assert.deepEqual(events, ['measure', 'schedule', 'measure', 'schedule'])
      context.readyToPresent = true
      events.length = 0
      frame()
      assert.deepEqual(events, ['measure', 'controls', 'billboard', 'draw', 'present', 'schedule'])
      assert.equal(context.initialView.cameraPosition, 'current camera')
      assert.equal(context.initialView.target, 'current target')
      events.length = 0
      frame()
      assert.ok(!events.includes('present'), 'only the first complete frame releases presentation')
    }
  })
}

test('zero-size host cannot present, and a resize before first draw is measured', () => {
  const { context, events, frame } = mount(0, 0)
  context.readyToPresent = true
  frame()
  assert.deepEqual(events, ['measure', 'schedule'])
  context.host.clientWidth = 1920
  context.host.clientHeight = 1080
  events.length = 0
  frame()
  assert.deepEqual(events, ['measure', 'controls', 'billboard', 'draw', 'present', 'schedule'])
})

test('a failed draw never releases the first-frame gate', () => {
  const { context, events, frame } = mount(1920, 1080)
  context.readyToPresent = true
  context.renderer.render = () => { throw new Error('GPU failure') }
  context.readiness.fail = () => events.push('failure')
  frame()
  assert.ok(events.includes('failure'))
  assert.ok(!events.includes('present'))
})
