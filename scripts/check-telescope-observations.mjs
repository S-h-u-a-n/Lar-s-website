import assert from 'node:assert/strict'
import { sameObservation, readObservations, RANDOM_LOCATIONS, RECOMMENDATIONS } from '../src/components/telescopeTest/observations.js'

const view = { id: 'existing', name: 'Existing observation', longitude: 121, latitude: 23.5, zoom: 9, bearing: 30, pitch: 55, roll: 3, mode: 'satellite', custom: 'keep' }
assert.ok(sameObservation(view, { ...view, longitude: 121.000000001, bearing: 390, zoom: 9.00000001 }))
for (const change of [{ pitch: 56 }, { roll: 4 }, { zoom: 10 }, { mode: 'globe' }, { longitude: 122 }, { bearing: 31 }]) assert.ok(!sameObservation(view, { ...view, ...change }))
assert.ok(sameObservation({ ...view, pitch: undefined, roll: undefined }, { ...view, pitch: 70, roll: 0 }))
assert.ok(sameObservation({ ...view, bearing: -3.233501 }, { ...view, bearing: -3.233499 }))
assert.ok(!sameObservation(view, { ...view, pitch: 56 }))
const bytes = JSON.stringify([view])
const storage = { getItem: () => bytes, setItem: () => assert.fail('Reading must not write') }
assert.deepEqual(readObservations(storage, 'test'), { items: [view], readable: true })
for (const value of ['{broken', '{}', '[null]', JSON.stringify([{ ...view, mode: 'street' }])]) assert.deepEqual(readObservations({ getItem: () => value }, 'test'), { items: [], readable: false })
assert.equal(RECOMMENDATIONS.length, 0)
assert.ok(RANDOM_LOCATIONS.length > 1)
console.log('Telescope checks passed: camera-state identity, float tolerance, legacy pitch defaults, existing fields, unreadable collection protection, empty recommendations.')
