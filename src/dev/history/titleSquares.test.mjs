import test from 'node:test'
import assert from 'node:assert/strict'
import { createTitleGate, fullyVisible } from './titleVisibility.js'
import { squareLayout, squarePose } from './squareLayout.js'

test('title waits for complete unanimated bounds and font readiness, then plays once', () => {
  const gate = createTitleGate(), viewport = {width:1200,height:800}
  const partial = {x:-1,y:100,width:550,height:160}
  const complete = {...partial,x:20}
  assert.equal(gate.check(partial,viewport),false)
  assert.equal(gate.check(complete,viewport,false),false)
  assert.equal(gate.check(complete,viewport),true)
  assert.equal(gate.check(partial,viewport),false)
  assert.equal(gate.check(complete,viewport),false)
  assert.equal(fullyVisible({...complete,y:700},viewport),false)
})
test('square anchors are deterministic and cover the full panorama', () => {
  const settings={count:30,seed:731,durationMin:14000,durationMax:22000}
  const a=squareLayout(settings,12524,2620,13)
  assert.deepEqual(a,squareLayout(settings,12524,2620,13))
  assert.equal(a.length,30)
  assert.equal(new Set(a.map(p=>Math.floor(p.x/(12524/10)))).size,10)
  assert.equal(new Set(a.map(p=>p.src)).size,13)
  assert.ok(a.every(p=>p.duration>=14000&&p.duration<=22000))
  for(const p of a){
    const atEnd=squarePose(p,p.duration-p.phaseTime,.307)
    assert.ok(atEnd.opacity<1e-10)
    for(const elapsed of [0,16000,100000]){
      const pose=squarePose(p,elapsed,.307)
      assert.ok(pose.opacity>=0&&pose.opacity<=1)
      assert.ok(Math.abs(pose.x-p.x)<(40+9)/.307)
      assert.ok(Math.abs(pose.y-p.y)<=160/.307)
    }
  }
})
