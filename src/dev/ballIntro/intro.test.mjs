import test from 'node:test'
import assert from 'node:assert/strict'
import { INTRO_IDENTITY, introChoreography, collectIntroTracks } from './introChoreography.js'
import { createIntroPlayback, waitForIntroAssets } from './introPlayback.js'
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve()}
function actor() {
  const animations=[]
  return {animations,animate(frames,options){
    const job=deferred()
    const animation={frames,options,finished:job.promise,cancelled:false,paused:false,currentTime:null,
      play(){this.paused=false},pause(){this.paused=true},cancel(){this.cancelled=true;job.reject(Error('cancelled'))},finish(){job.resolve()},
    }
    animations.push(animation);return animation
  }}
}
for(const [width,height] of [[1440,900],[1920,1080],[2560,1080],[1024,600]]) {
  test(`every permanent component lands at identity: ${width}x${height}`,()=>{
    const kinds=['geometry','title','character','poster','tools','back','arrow','dialogue','credit']
    for(const kind of kinds)for(let index=0;index<3;index++) {
      const track=introChoreography(kind,index,{width,height},{left:width*.34,top:height*.25,width:width*.32,height:height*.16})
      assert.equal(track.frames.at(-1).transform,INTRO_IDENTITY)
      assert.equal(track.frames.at(-1).offset,1)
      assert.ok(track.duration>0 && track.delay>=0)
      assert.ok(!JSON.stringify(track).includes('NaN'))
      assert.ok(!JSON.stringify(track).includes('Infinity'))
    }
    const left=introChoreography('character',0,{width,height},{left:width*.05,width:width*.23})
    const right=introChoreography('character',0,{width,height},{left:width*.72,width:width*.23})
    assert.match(left.frames[0].transform,/translate\(-/)
    assert.ok(!right.frames[0].transform.startsWith('translate(-'))
    const last=introChoreography('spark',4,{width,height})
    assert.equal(last.duration+last.delay,3350)
  })
}

test('completion removes every effect instead of retaining a pixel-based final transform',async()=>{
  const node=actor(),results=[]
  const player=createIntroPlayback({onComplete:error=>results.push(error)})
  const track={...introChoreography('title',0,{width:1440,height:900}),node,opacity:1}
  player.start([track])
  assert.equal(node.animations.length,2)
  assert.equal(node.animations[0].options.composite,'add')
  assert.equal(node.animations[1].options.composite,undefined)
  assert.equal(node.animations[0].currentTime,0)
  node.animations.forEach(animation=>animation.finish());await flush()
  assert.ok(node.animations.every(animation=>animation.cancelled))
  assert.deepEqual(results,[undefined])
})

test('skip, replay, pause and disposal cannot leave stale effects or complete another run',async()=>{
  const node=actor(),completed=[]
  const player=createIntroPlayback({onComplete:()=>completed.push(true)})
  const tracks=[{...introChoreography('character',0,{width:1920,height:1080}),node,opacity:1}]
  player.start(tracks)
  const first=[...node.animations]
  player.pause();assert.ok(first.every(a=>a.paused))
  player.resume();assert.ok(first.every(a=>!a.paused))
  player.start(tracks)
  assert.ok(first.every(a=>a.cancelled))
  first.forEach(a=>a.finish());await flush();assert.equal(completed.length,0)
  player.skip();await flush()
  assert.equal(completed.length,1)
  assert.ok(node.animations.every(a=>a.cancelled))
  player.start(tracks);player.dispose();await flush()
  assert.equal(completed.length,1)
  assert.ok(node.animations.every(a=>a.cancelled))
})

test('reduced motion and unsupported animation immediately expose the normal page',()=>{
  const node=actor(),completed=[]
  const player=createIntroPlayback({onComplete:result=>completed.push(result)})
  const track={...introChoreography('poster',0,{width:1440,height:900}),node,opacity:1}
  player.start([track],{reduced:true})
  assert.equal(node.animations.length,0);assert.equal(completed.length,1)
  player.start([{...track,node:{animate(){throw Error('unsupported')}}}])
  assert.equal(completed[1].message,'unsupported')
})

test('collector uses actual element bounds, decor opacity and only current Ball components',()=>{
  const old=globalThis.getComputedStyle
  globalThis.getComputedStyle=()=>({opacity:'.72'})
  const geo={getBoundingClientRect:()=>({left:0,top:0,width:60,height:60})}
  const poster={getBoundingClientRect:()=>({left:500,top:200,width:400,height:140})}
  try {
    const tracks=collectIntroTracks({querySelectorAll(selector){return selector==='.ball-background > i'?[geo]:selector==='.ball-cover-window > .ball-cover'?[poster]:[]}}, {width:1440,height:900})
    assert.equal(tracks.length,2)
    assert.equal(tracks[0].opacity,.72)
    assert.equal(tracks[1].opacity,1)
    assert.equal(tracks[1].node,poster)
  } finally {globalThis.getComputedStyle=old}
})


function assetFixture() {
  const original={document:globalThis.document,MutationObserver:globalThis.MutationObserver}
  let observer
  globalThis.MutationObserver=class {
    constructor(callback){this.callback=callback;this.disconnected=false;observer=this}
    observe(){} disconnect(){this.disconnected=true}
  }
  globalThis.document={fonts:{ready:Promise.resolve()}}
  const portrait={dataset:{loadState:'loading'}},imageJob=deferred()
  const image={loading:'lazy',decode:()=>imageJob.promise}
  const host={querySelectorAll(selector){return selector==='.ball-portrait'?[portrait]:selector==='.ball-cover-image'?[image]:[]}}
  return {host,portrait,image,imageJob,get observer(){return observer},restore(){globalThis.document=original.document;globalThis.MutationObserver=original.MutationObserver}}
}

test('asset gate waits for decoded portraits and posters, and requests lazy posters eagerly',async()=>{
  const f=assetFixture(),abort=new AbortController()
  try {
    let ready=false
    const waiting=waitForIntroAssets(f.host,abort.signal).then(()=>{ready=true})
    await flush();assert.equal(ready,false)
    f.portrait.dataset.loadState='ready';f.observer.callback();await flush()
    assert.equal(f.image.loading,'eager');assert.equal(ready,false)
    f.imageJob.resolve();await waiting
    assert.equal(ready,true);assert.ok(f.observer.disconnected)
  } finally {f.restore()}
})

test('skip while waiting for portraits disconnects observation',async()=>{
  const f=assetFixture(),abort=new AbortController()
  try {
    const waiting=waitForIntroAssets(f.host,abort.signal)
    abort.abort()
    await assert.rejects(waiting,{name:'AbortError'})
    assert.ok(f.observer.disconnected)
  } finally {f.restore()}
})

test('failed portrait loading rejects promptly so the normal retry UI can be shown',async()=>{
  const f=assetFixture(),abort=new AbortController()
  try {
    f.portrait.dataset.loadState='error'
    await assert.rejects(waitForIntroAssets(f.host,abort.signal),/角色素材/)
    assert.ok(f.observer.disconnected)
  } finally {f.restore()}
})
