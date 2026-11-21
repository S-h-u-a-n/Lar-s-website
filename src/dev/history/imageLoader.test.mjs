import test from 'node:test'
import assert from 'node:assert/strict'
import { createImageLoader } from './imageLoader.js'

const flush = () => new Promise(resolve => setImmediate(resolve))
function fixture() {
  const started = [], controls = []
  const assets = Array.from({ length: 5 }, (_, i) => ({ id: `asset-${i}`, x: i * 100, width: 20, src: `/${i}.PNG` }))
  const images = assets.map((_, i) => ({ dataset: {}, naturalWidth: 100, naturalHeight: 100,
    set src(value) { started.push([i, value]) },
    decode() { return new Promise((resolve, reject) => { controls[i] = { resolve, reject } }) },
  }))
  return { started, controls, assets, images }
}

test('prioritizes right edge, bounds decoding, and assigns each source once after reprioritization', async () => {
  const f = fixture(), loader = createImageLoader(f.assets, f.images, () => {})
  loader.prioritize([3, 4], 450)
  assert.deepEqual(f.started.map(([i]) => i), [4, 3])
  assert.equal(loader.state.filter(s => s === 'loading').length, 2)
  loader.prioritize([0], 0)
  f.controls[4].resolve(); await flush()
  assert.deepEqual(f.started.map(([i]) => i), [4, 3, 0])
  f.controls[3].resolve(); await flush()
  f.controls[0].resolve(); await flush()
  for (const c of f.controls) c?.resolve()
  await flush()
  assert.deepEqual(loader.state, Array(5).fill('ready'))
  assert.equal(new Set(f.started.map(([i]) => i)).size, 5)
  assert.equal(f.started.length, 5)
})

test('one failed image is terminal and does not prevent remaining assets from loading', async t => {
  const f = fixture(), errors = []
  t.mock.method(console, 'error', (...args) => errors.push(args))
  const loader = createImageLoader(f.assets, f.images, () => {})
  loader.prioritize([4], 450)
  f.controls[4].reject(new Error('decode failure')); await flush()
  assert.equal(loader.state[4], 'failed')
  assert.equal(f.images[4].dataset.loadState, 'failed')
  assert.equal(errors.length, 1)
  for (let round = 0; round < 5; round++) {
    f.controls.forEach(c => c?.resolve()); await flush()
  }
  assert.equal(loader.state.filter(s => s === 'ready').length, 4)
  assert.equal(f.started.length, 5)
})

test('dispose prevents queued requests and callbacks after in-flight decode completes', async () => {
  const f = fixture(); let notifications = 0
  const loader = createImageLoader(f.assets, f.images, () => notifications++)
  loader.prioritize([4], 450); loader.dispose()
  f.controls.forEach(c => c?.resolve()); await flush()
  assert.equal(f.started.length, 2)
  assert.equal(notifications, 0)
})

test('opening defers background requests while allowing priority viewport loads, then resumes', async () => {
  const f = fixture(), loader = createImageLoader(f.assets, f.images, () => {})
  loader.setBackgroundPaused(true)
  loader.prioritize([4], 450)
  assert.deepEqual(f.started.map(([i]) => i), [4])
  f.controls[4].resolve(); await flush()
  assert.equal(f.started.length, 1)
  loader.prioritize([0], 0)
  assert.deepEqual(f.started.map(([i]) => i), [4, 0])
  f.controls[0].resolve(); await flush()
  loader.setBackgroundPaused(false)
  assert.equal(f.started.length, 4)
  for (let round=0;round<5;round++){ f.controls.forEach(c=>c?.resolve()); await flush() }
  assert.deepEqual(loader.state,Array(5).fill('ready'))
})
