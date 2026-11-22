import test from 'node:test'
import assert from 'node:assert/strict'
import { finishComicSequence } from './comicSequence.js'

test('finishing a comic cancels pending work and is idempotent', () => {
  const cancelledFrames = [], cancelledTimers = []
  const finishedRef = { current: false }
  const busyRef = { current: false }
  const requestFrameRef = { current: 17 }
  const timersRef = { current: new Set([21, 22]) }
  const options = {
    finishedRef,
    busyRef,
    requestFrameRef,
    timersRef,
    cancelFrame: id => cancelledFrames.push(id),
    clearTimer: id => cancelledTimers.push(id),
  }

  assert.equal(finishComicSequence(options), true)
  assert.equal(finishedRef.current, true)
  assert.equal(busyRef.current, true)
  assert.equal(requestFrameRef.current, null)
  assert.deepEqual(cancelledFrames, [17])
  assert.deepEqual(cancelledTimers, [21, 22])
  assert.equal(timersRef.current.size, 0)
  assert.equal(finishComicSequence(options), false)
  assert.deepEqual(cancelledFrames, [17])
  assert.deepEqual(cancelledTimers, [21, 22])
})
