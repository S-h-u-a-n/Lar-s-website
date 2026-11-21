import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { entranceProgress, localPoint, opaqueAt, spring } from './interactionMath.js'
import { createEntryGesture } from './entryGesture.js'
const settings = { quietMs: 650, dwellMs: 650, gestureWindowMs: 400, thresholdPx: 60 }

test('arrival plus one continuous momentum stream cannot enter; fresh gesture enters only once', () => {
  const gate = createEntryGesture(settings)
  assert.equal(gate.wheel(0, true, 10000), false)
  gate.arrive(16)
  for (let time = 30; time <= 5000; time += 30) assert.equal(gate.wheel(time, true, 15), false)
  assert.equal(gate.wheel(6000, true, 25), false)
  assert.equal(gate.wheel(6030, true, 40), true)
  assert.equal(gate.wheel(8000, true, 100), false)
})
test('reverse and leave cancel entry intent, and early input does not arm', () => {
  const gate = createEntryGesture(settings)
  gate.arrive(0)
  assert.equal(gate.wheel(200, true, 100), false)
  assert.equal(gate.wheel(1000, true, 30), false)
  assert.equal(gate.wheel(1010, false, 100), false)
  assert.equal(gate.wheel(1020, true, 100), false)
  gate.leave(); assert.equal(gate.wheel(2000, true, 100), false)
})
test('entrances overlap in specified order, overshoot gently and end at exact originals', () => {
  const map = { delay: 0, duration: 620, overshoot: .65 }
  const people = { delay: 140, duration: 720, overshoot: .65 }
  const layer = { delay: 260, duration: 500 }
  assert(entranceProgress(100, map).progress > 0)
  assert.equal(entranceProgress(100, people).progress, 0)
  assert(entranceProgress(200, people).progress > 0)
  assert.equal(entranceProgress(200, layer).progress, 0)
  assert(entranceProgress(400, layer).progress > 0)
  assert(entranceProgress(500, map).offset < 0)
  for (const g of [map, people, layer]) assert.equal(entranceProgress(2000, g).offset, 0)
  assert.equal(entranceProgress(0, people, true).progress, 1)
})
test('projected hit mapping returns local coordinates with foot pivot, scale and two-axis sway', () => {
  const p = { x: 130, y: 240, width: 270, height: 380, origin: [53, 95], entryY: 17, rotateX: 2, rotateZ: -5, scale: 1.1, perspective: 800 }
  const u=85,v=170,ox=p.width*p.origin[0]/100,oy=p.height*p.origin[1]/100
  const ax=p.rotateX*Math.PI/180,az=p.rotateZ*Math.PI/180,dx=(u-ox)*p.scale,dy=(v-oy)*p.scale
  const rx=Math.cos(az)*dx-Math.sin(az)*dy,ry=Math.sin(az)*dx+Math.cos(az)*dy,w=1-Math.sin(ax)*ry/p.perspective
  const [resultX,resultY]=localPoint(p,p.x+ox+rx/w,p.y+oy+p.entryY+Math.cos(ax)*ry/w)
  assert(Math.abs(resultX-u)<1e-8);assert(Math.abs(resultY-v)<1e-8)
})
test('packed masks reject transparent canvas; all foot pivots lie on silhouette bottoms', () => {
  const all=JSON.parse(fs.readFileSync(new URL('./interactionGeometry.json',import.meta.url),'utf8'))
  assert.equal(Object.keys(all).length,18)
  for(const g of Object.values(all)){
    const bits=Buffer.from(g.bits,'base64')
    assert.equal(opaqueAt(g,bits,0,0,2109,2984),false)
    assert(g.foot[1]>85&&g.foot[1]<100)
    assert.equal(bits.length,Math.ceil(g.maskWidth*g.maskHeight/8))
    assert([...bits].some(b=>b!==0))
  }
})
test('hover scaling settles exactly at 1.10 then returns to 1 without accumulating position', () => {
  const s={value:1,velocity:0}
  for(let n=0;n<240;n++)spring(s,1.1,1/60,95,20)
  assert.equal(s.value,1.1)
  for(let n=0;n<240;n++)spring(s,1,1/60,95,20)
  assert.deepEqual(s,{value:1,velocity:0})
})
