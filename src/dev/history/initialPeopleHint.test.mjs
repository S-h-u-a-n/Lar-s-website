import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { initialHintPeople, createInitialPeopleHint } from './initialPeopleHint.js'

const placements = JSON.parse(fs.readFileSync(new URL('./placements.json', import.meta.url)))
const geometry = JSON.parse(fs.readFileSync(new URL('./interactionGeometry.json', import.meta.url)))
const assets = placements.map(asset => ({ ...asset, interaction: geometry[asset.id] }))

test('visible right-to-left silhouettes select the first three humans at desktop sizes', () => {
  for (const [width, height] of [[1512, 805], [1512, 861], [1920, 1080]]) {
    const scale = Math.max(height / 2620, width / 12524)
    const indices = initialHintPeople(assets, { width, height, scale, cameraPx: 12524 * scale - width, ready: () => true })
    assert.deepEqual(indices.map(i => assets[i].id), ['people-1', 'people-2', 'people-3'])
  }
})

test('only decoded interactive silhouettes are candidates', () => {
  const scale = 805 / 2620
  const indices = initialHintPeople(assets, { width: 1512, height: 805, scale, cameraPx: 12524 * scale - 1512, ready: i => assets[i].id !== 'people-1' })
  assert.deepEqual(indices.map(i => assets[i].id), ['people-2', 'people-3', 'people-4'])
})

test('500ms pulses overlap at 180ms intervals and end after one 860ms wave', () => {
  const hint = createInitialPeopleHint([0, 1, 2], 1050)
  assert.equal(hint.update(1049).size, 0)
  assert.deepEqual([...hint.update(1050 + 179).keys()], [0])
  assert.deepEqual([...hint.update(1050 + 181).keys()], [0, 1])
  assert.deepEqual([...hint.update(1050 + 361).keys()], [0, 1, 2])
  assert.deepEqual([...hint.update(1050 + 500).keys()], [1, 2])
  assert.deepEqual([...hint.update(1050 + 680).keys()], [2])
  assert.equal(hint.update(1050 + 860).size, 0)
  assert.equal(hint.running, false)
  assert.equal(hint.phase, 'complete')
  assert.equal(hint.update(10000).size, 0)
})

test('each cue has exactly one 1.10 peak and no scale undershoot or extra bounce', () => {
  for (let index = 0; index < 3; index++) {
    const hint = createInitialPeopleHint([0, 1, 2], 0)
    let previous = 0
    for (let ms = 0; ms <= 500; ms++) {
      const weight = hint.update(index * 180 + ms).get(index) ?? 0
      assert(weight >= 0 && weight <= 1)
      assert(ms <= 250 ? weight >= previous : weight <= previous)
      if (ms === 250) assert.equal(1 + .1 * weight, 1.1)
      previous = weight
    }
  }
})

test('scroll cancels pending cues, restores active ones smoothly and never restarts', () => {
  const hint = createInitialPeopleHint([0, 1, 2], 0)
  const before = hint.update(150).get(0)
  hint.cancel(150)
  assert.equal(hint.update(150).get(0), before)
  assert(hint.update(210).get(0) < before)
  assert.deepEqual([...hint.update(220).keys()], [0])
  hint.cancel(220) // Repeated render cancellation cannot extend restoration.
  assert.equal(hint.update(270).size, 0)
  assert.equal(hint.running, false)
  assert.equal(hint.update(5000).size, 0)
})

test('cancellation before the first cue never starts a pulse', () => {
  const hint = createInitialPeopleHint([0, 1, 2], 1050)
  hint.cancel(100)
  assert.equal(hint.update(100).size, 0)
  assert.equal(hint.running, false)
  assert.equal(hint.update(1500).size, 0)
})
