import test from 'node:test'
import assert from 'node:assert/strict'
import { openingSettings, openingKeyframes, warmOpeningActor, startOpeningActor } from './openingAnimation.js'
const entrance={map:{delay:0,duration:620,fromY:240,overshoot:.65},people:{delay:140,duration:720,fromY:300,overshoot:.65},layer:{delay:260,duration:500,stagger:120}}

test('three backgrounds have independent overlapping fades without translation',()=>{
  const groups=[1,2,3].map(n=>openingSettings({id:`layer-${n}`},entrance))
  assert.deepEqual(groups.map(g=>g.delay),[260,380,500])
  for(const g of groups){const frames=openingKeyframes(g,0);assert.equal(frames[0].opacity,0);assert.equal(frames.at(-1).opacity,1);assert.ok(frames.every(f=>!('transform' in f)))}
})
test('map and people preserve distance, gentle overshoot and exact resting position',()=>{
  for(const id of ['map-1','people-1']){
    const g=openingSettings({id},entrance),frames=openingKeyframes(g,380)
    assert.ok(Math.abs(Number(frames[0].transform.slice(11,-3))-380)<1e-9)
    assert.equal(frames.at(-1).transform,'translateY(0px)')
    assert.equal(frames.at(-1).opacity,1)
    const positions=frames.map(f=>Number(f.transform.slice(11,-3)))
    assert.ok(Math.min(...positions)<0&&Math.min(...positions)>-12)
  }
})
test('decode-ready warm paint precedes animation; finishing retains surfaces until owner releases',async()=>{
  let finish,notified=0,cancelled=0
  const animation={finished:new Promise(resolve=>{finish=resolve}),cancel(){cancelled++}}
  const node={style:{},animate(frames,timing){assert.equal(node.style.opacity,'0.001');assert.equal(timing.fill,'both');return animation}}
  warmOpeningActor(node,'people')
  assert.equal(node.style.visibility,'visible')
  startOpeningActor(node,openingSettings({id:'people-1'},entrance),380,1000,()=>notified++)
  assert.equal(animation.startTime,1000)
  finish();await animation.finished;await Promise.resolve()
  assert.equal(notified,1);assert.equal(cancelled,0)
  assert.equal(node.style.opacity,'1');assert.equal(node.style.transform,'none')
})
