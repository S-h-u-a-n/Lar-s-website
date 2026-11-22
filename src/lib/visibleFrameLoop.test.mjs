import test from 'node:test'
import assert from 'node:assert/strict'
import { createVisibleFrameLoop, createFrameBatch } from './visibleFrameLoop.js'
import { acquireParallax } from '../edition/useParallax.js'

function harness(hidden = false) {
  const doc = new EventTarget()
  doc.hidden = hidden
  doc.show = visible => { doc.hidden = !visible; doc.dispatchEvent(new Event('visibilitychange')) }
  let serial = 0
  const jobs = new Map()
  return { doc, raf(fn) { const id = ++serial; jobs.set(id,fn); return id }, cancel(id) { jobs.delete(id) },
    tick(time=0) { const batch = [...jobs.values()]; jobs.clear(); batch.forEach(fn => fn(time)) },
    get pending() { return jobs.size },
  }
}

test('visible rendering keeps every frame; hidden rendering cancels, resumes once, and cleans up', () => {
  const clock = harness(), frames = []
  let resumed = 0
  const loop = createVisibleFrameLoop(time => { frames.push(time); loop.request() }, {...clock,onResume:()=>resumed++})
  loop.request(); loop.request()
  assert.equal(clock.pending,1)
  for(let i=0;i<60;i++) clock.tick(i)
  assert.equal(frames.length,60)
  clock.doc.show(false)
  assert.equal(clock.pending,0)
  for(let i=0;i<60;i++) clock.tick(i)
  assert.equal(frames.length,60)
  loop.request()
  assert.equal(clock.pending,0)
  clock.doc.show(true)
  assert.equal(clock.pending,1)
  assert.equal(resumed,1)
  clock.tick(100)
  assert.equal(frames.length,61)
  loop.dispose(); loop.request(); clock.doc.show(false); clock.doc.show(true)
  assert.equal(clock.pending,0)
})

test('initially hidden loading can request a frame without drawing or losing readiness on resume', () => {
  const clock = harness(true)
  let draws = 0
  const loop = createVisibleFrameLoop(()=>draws++,clock)
  loop.request()
  assert.equal(clock.pending,0)
  clock.doc.show(true); clock.tick()
  assert.equal(draws,1)
  clock.doc.show(false); clock.doc.show(true)
  assert.equal(clock.pending,0,'a finished/error callback must not be restarted')
  loop.dispose()
})

test('drag overlay batches a thousand coordinates to one update; release and unmount discard stale work', () => {
  const clock = harness(), updates = []
  const batch = createFrameBatch(value=>updates.push(value),clock)
  for(let x=0;x<1000;x++) batch.push({x})
  assert.equal(clock.pending,1)
  clock.tick()
  assert.deepEqual(updates,[{x:999}])
  batch.push({x:1000}); batch.flush(null); clock.tick()
  assert.deepEqual(updates,[{x:999},null])
  batch.push({x:1}); batch.cancel(); clock.tick()
  assert.equal(updates.length,2)
  batch.push({x:2}); clock.tick()
  assert.deepEqual(updates.at(-1),{x:2},'StrictMode remount remains usable')
})

test('App and sandbox share exactly one parallax listener set and release only after the final owner', () => {
  const root = {}
  let starts = 0, stops = 0
  const setup = () => { starts++; return () => stops++ }
  const app = acquireParallax(root,setup), sandbox = acquireParallax(root,setup)
  assert.equal(starts,1)
  sandbox(); sandbox()
  assert.equal(stops,0)
  app()
  assert.equal(stops,1)
  const remount = acquireParallax(root,setup)
  assert.equal(starts,2)
  remount()
  assert.equal(stops,2)
})
