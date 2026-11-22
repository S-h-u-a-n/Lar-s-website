import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MATERIAL as M, PALETTE as P, RULES as R } from './config.js'
import { createWorld } from './simulation.js'
import { change } from './materials.js'
import { paintPlantFlowers } from './flowers.js'
import { createRenderer } from './renderer.js'

function fixture() {
  const world = createWorld({ columns: 24, rows: 24 })
  world.material.fill(M.AIR); world.counts.fill(0); world.counts[M.AIR] = world.material.length
  world.light = 55; world.moisture.fill(.65); world.temperatureGrid.fill(18)
  const root = 18 * 24 + 12
  change(world, root, M.SOIL)
  for (let depth = 1; depth <= 3; depth++) {
    const i = root - depth * 24
    change(world, i, M.PLANT)
    world.plantRoot[i] = root + 1; world.plantParent[i] = i + 24 + 1
    world.plantDepth[i] = depth; world.plantStress[i] = 0
    world.age[i] = R.plantBloomDelay * R.fps
  }
  return { world, root, tip: root - 3 * 24 }
}
const pixels = world => { const data = new Uint8ClampedArray(world.material.length * 4); data.fill(50); return data }
const color = (data, i) => [...data.slice(i * 4, i * 4 + 3)]

test('only delayed, healthy exposed tips bloom, even at the growth depth limit', () => {
  const { world, tip } = fixture()
  world.age[tip]--
  let data = pixels(world); paintPlantFlowers(world, data)
  assert.deepEqual(color(data, tip), [50,50,50])
  world.age[tip]++; world.plantDepth[tip] = R.plantMaxDepth
  data = pixels(world); paintPlantFlowers(world, data)
  assert.deepEqual(color(data, tip), P.flowerCenter)
  assert.deepEqual(color(data, tip + 24), [50,50,50], 'stem remains green in the renderer')
  assert.deepEqual(color(data, tip - 24), P.flowers[world.tint[tip] % P.flowers.length])
})

test('petals do not replace terrain, water, snow or other material pixels', () => {
  for (const material of [M.ROCK, M.SOIL, M.SAND, M.WATER, M.SNOW, M.LAVA, M.GROWTH]) {
    const { world, tip } = fixture()
    change(world, tip + 1, material)
    const data = pixels(world); paintPlantFlowers(world, data)
    assert.deepEqual(color(data, tip + 1), [50,50,50])
    assert.deepEqual(color(data, tip), P.flowerCenter)
  }
})

test('stress, unsuitable conditions, lost support, burial and removal hide blossoms', () => {
  const cases = [
    (w,i) => { w.plantStress[i] = 2 },
    (w,i) => { w.moisture[i] = 0 },
    (w,i) => { w.temperatureGrid[i] = -10 },
    (w,i) => { w.temperatureGrid[i] = 60 },
    w => { w.light = 0 },
    (w,i) => change(w,i+24,M.AIR),
    (w,i) => change(w,i-24,M.SNOW),
    (w,i) => change(w,i,M.AIR),
  ]
  for (const alter of cases) {
    const { world, tip } = fixture(); alter(world,tip)
    const data = pixels(world); paintPlantFlowers(world,data)
    assert.deepEqual(color(data,tip),[50,50,50])
  }
})

test('flowers are deterministic and do not alter particles, randomness or growth state', () => {
  const { world, tip } = fixture()
  const before = structuredClone(world)
  const variants = new Set()
  for (let tint = 0; tint < P.flowers.length; tint++) {
    world.tint[tip] = tint
    const a=pixels(world), b=pixels(world)
    paintPlantFlowers(world,a); paintPlantFlowers(world,b)
    assert.deepEqual(a,b)
    variants.add(color(a,tip-24).join(','))
  }
  world.tint[tip] = before.tint[tip]
  assert.equal(variants.size, P.flowers.length)
  assert.deepEqual(world,before)
})

test('production renderer refreshes flowers on age changes and clears them after removal', () => {
  const { world, tip } = fixture()
  let image
  const context = { createImageData: (w,h) => ({data:new Uint8ClampedArray(w*h*4)}), putImageData: pixels => { image=pixels.data.slice() } }
  const original = globalThis.document
  globalThis.document = { createElement: () => ({width:0,height:0,getContext:()=>context}) }
  try {
    const render=createRenderer(), ctx={clearRect(){},drawImage(){}}
    world.age[tip]--; render(ctx,world)
    assert.notDeepEqual(color(image,tip),P.flowerCenter)
    world.age[tip]++; world.tick++; render(ctx,world)
    assert.deepEqual(color(image,tip),P.flowerCenter)
    change(world,tip,M.AIR); world.tick++; render(ctx,world)
    assert.notDeepEqual(color(image,tip),P.flowerCenter)
    assert.notDeepEqual(color(image,tip-24),P.flowers[world.tint[tip]%P.flowers.length])
  } finally { globalThis.document=original }
})
