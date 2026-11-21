import test from 'node:test'
import assert from 'node:assert/strict'
import { geometryPointerGain, geometryFloat } from './geometryMotion.js'

test('all nine rectangles have small, varied nonzero gains for the full-page pointer', () => {
  for (let i = 0; i < 9; i++) {
    const gain = geometryPointerGain(i)
    assert(Math.abs(gain.x) > 0 && Math.abs(gain.x) <= 9)
    assert(Math.abs(gain.y) > 0 && Math.abs(gain.y) <= 6)
    assert.notDeepEqual(gain, geometryPointerGain(i + 1))
  }
})
test('float motion is bounded, ongoing, and different across squares', () => {
  for (let i = 0; i < 9; i++) {
    assert.notDeepEqual(geometryFloat(0, i), geometryFloat(3, i))
    assert.notDeepEqual(geometryFloat(3, i), geometryFloat(3, i + 1))
    for (let t = 0; t < 120; t++) {
      const value = geometryFloat(t, i)
      assert(Math.abs(value.x) <= 7 && Math.abs(value.y) <= 7)
    }
  }
})
