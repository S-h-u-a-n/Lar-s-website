import test from 'node:test'
import assert from 'node:assert/strict'
import { createResourceGate, waitForVisibleOverview } from './asyncReadiness.js'

function clock() {
  let now = 0, id = 0
  const jobs = new Map()
  return {
    setTimer(fn, delay) { const key = ++id; jobs.set(key, { fn, at: now + delay }); return key },
    clearTimer(key) { jobs.delete(key) },
    advance(ms) { now += ms; for (const [key, job] of [...jobs]) if (job.at <= now) { jobs.delete(key); job.fn() } },
    now: () => now,
    get pending() { return jobs.size },
  }
}
function visibleDocument() {
  const document = new EventTarget()
  document.hidden = false
  document.hide = value => { document.hidden = value; document.dispatchEvent(new Event('visibilitychange')) }
  return document
}

test('required resources never become ready merely because time passes; timeout exposes failure', () => {
  const timer = clock(); let ready = 0, errors = 0, aborted = 0
  const gate = createResourceGate({ ...timer, onReady: () => ready++, onError: () => errors++, abort: () => aborted++ })
  timer.advance(59999); assert.equal(gate.pending, true); assert.equal(ready, 0)
  timer.advance(1); assert.equal(errors, 1); assert.equal(aborted, 1)
  gate.complete(); gate.fail(new Error()); assert.equal(ready, 0); assert.equal(errors, 1)
})
test('first-frame completion cancels the timeout and only commits once', () => {
  const timer = clock(); let ready = 0, errors = 0
  const gate = createResourceGate({ ...timer, onReady: () => ready++, onError: () => errors++ })
  gate.complete(); gate.complete(); timer.advance(60000)
  assert.equal(ready, 1); assert.equal(errors, 0); assert.equal(timer.pending, 0)
})
test('unmount aborts preparation and ignores a late loader completion', () => {
  const timer = clock(); let callbacks = 0, aborted = 0
  const gate = createResourceGate({ ...timer, onReady: () => callbacks++, onError: () => callbacks++, abort: () => aborted++ })
  gate.dispose(); gate.complete(); gate.fail(new Error()); timer.advance(60000)
  assert.equal(callbacks, 0); assert.equal(aborted, 1); assert.equal(timer.pending, 0)
})
test('hidden time does not consume a visibility-paused resource deadline', () => {
  const timer = clock(), document = visibleDocument(); let errors = 0
  const gate = createResourceGate({ ...timer, document, pauseOnHidden: true, timeoutMs: 100, onReady() {}, onError: () => errors++ })
  timer.advance(40); document.hide(true); timer.advance(1000)
  assert.equal(errors, 0); assert.equal(timer.pending, 0)
  document.hide(false); timer.advance(59); assert.equal(errors, 0)
  timer.advance(1); assert.equal(errors, 1); assert.equal(timer.pending, 0)
})
test('a resource mounted in a hidden tab starts its full deadline when visible', () => {
  const timer = clock(), document = visibleDocument(); document.hidden = true; let errors = 0
  createResourceGate({ ...timer, document, pauseOnHidden: true, timeoutMs: 100, onReady() {}, onError: () => errors++ })
  timer.advance(1000); assert.equal(errors, 0); assert.equal(timer.pending, 0)
  document.hide(false); timer.advance(99); assert.equal(errors, 0)
  timer.advance(1); assert.equal(errors, 1)
})
test('visible overview lasts 1250ms and expands only once', () => {
  const timer = clock(), document = visibleDocument(); let expanded = 0
  waitForVisibleOverview(() => expanded++, { ...timer, document })
  timer.advance(1249); assert.equal(expanded, 0)
  timer.advance(1); assert.equal(expanded, 1)
  document.hide(true); document.hide(false); timer.advance(5000); assert.equal(expanded, 1)
})
test('hidden time does not consume overview dwell; user action or unmount cancels it', () => {
  const timer = clock(), document = visibleDocument(); let expanded = 0
  const cancel = waitForVisibleOverview(() => expanded++, { ...timer, document })
  timer.advance(700); document.hide(true); timer.advance(10000); assert.equal(expanded, 0)
  document.hide(false); timer.advance(1249); assert.equal(expanded, 0)
  cancel(); timer.advance(10000); document.hide(false); assert.equal(expanded, 0); assert.equal(timer.pending, 0)
})
test('a hidden mount waits for its first visible overview', () => {
  const timer = clock(), document = visibleDocument(); document.hidden = true; let expanded = 0
  waitForVisibleOverview(() => expanded++, { ...timer, document })
  timer.advance(10000); assert.equal(expanded, 0)
  document.hide(false); timer.advance(1250); assert.equal(expanded, 1)
})
