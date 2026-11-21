import test from 'node:test'
import assert from 'node:assert/strict'
import { characterIndex, geometry, modulo, rebase, wheelPixels } from './gridMath.js'

test('all characters participate, including negative coordinates and future counts', () => {
  for (const count of [1, 21, 27, 37]) {
    const found = new Set()
    for (let c = -count; c < count; c++) found.add(characterIndex(c, -17, count))
    assert.equal(found.size, count)
    assert.equal(characterIndex(-3, -9, count), characterIndex(-3 + count, -9, count))
  }
})
test('fixed pool covers viewport at distant positions without slot collisions', () => {
  for (const [width, height] of [[390, 600], [1512, 600], [3840, 2160]]) {
    const grid = geometry(width, height)
    for (const x of [-1e8 - 37, -500, 0, 50, 1e8 + 19]) {
      const first = Math.floor(-x / grid.stepX) - 1
      const used = new Set()
      for (let c = first; c < first + grid.columns; c++) used.add(modulo(c, grid.columns))
      assert.equal(used.size, grid.columns)
      assert.ok(first * grid.stepX + x < 0)
      assert.ok((first + grid.columns - 1) * grid.stepX + x > width)
      const firstRow = Math.floor(-x / grid.stepY) - 1
      assert.ok(firstRow * grid.stepY + x < 0)
      assert.ok((firstRow + grid.rows - 1) * grid.stepY + x > height)
    }
  }
})
test('rebasing preserves positions and character identity in both axes', () => {
  for (const count of [21, 27, 37]) {
    for (const [x, y] of [[1e8, -1e8], [-40123, 88200], [24, 26]]) {
      const nx = rebase(x, 210, count), ny = rebase(y, 200, count)
      const dc = Math.round((x - nx) / 210), dr = Math.round((y - ny) / 200)
      assert.ok(Math.abs(nx) <= 210 * count / 2)
      assert.ok(Math.abs(ny) <= 200 * count / 2)
      assert.equal(characterIndex(3, -8, count), characterIndex(3 + dc, -8 + dr, count))
      assert.ok(Math.abs((3 + dc) * 210 + nx - (3 * 210 + x)) < .001)
    }
  }
})
test('wheel respects both axes and pixel, line, and page units', () => {
  assert.deepEqual(wheelPixels({ deltaX: 3, deltaY: -5, deltaMode: 0 }, 1000, 600), { x: 3, y: -5 })
  assert.deepEqual(wheelPixels({ deltaX: 3, deltaY: -5, deltaMode: 1 }, 1000, 600), { x: 48, y: -80 })
  assert.deepEqual(wheelPixels({ deltaX: 1, deltaY: -1, deltaMode: 2 }, 1000, 600), { x: 1000, y: -600 })
})
