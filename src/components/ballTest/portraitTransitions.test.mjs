import test from 'node:test'
import assert from 'node:assert/strict'
import { createPortraitTransitions, portraitTransition } from './portraitTransitions.js'
import { parseCharacterCue, parseDialogueScript, normalizeDialogue, dialoguePortraits } from './dialogueCues.js'
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b }); return {promise,resolve,reject} }
const flush = async () => { for(let i=0;i<8;i++) await Promise.resolve() }
const pair = (body,face) => ({body,face,bodyUrl:`body-${body}`,faceUrl:`face-${face}`})
function fixture(load = () => Promise.resolve()) {
  const paints=[],animations=[],statuses=[]
  const controller=createPortraitTransitions({load,paint:(current,previous)=>paints.push({current,previous}),onStatus:(...status)=>statuses.push(status),animate:(layer,frames,options)=>{
    const job=deferred()
    const animation={layer,frames,options,finished:job.promise,done:false,cancelled:false,
      finish(){if(!this.done){this.done=true;job.resolve()}},
      cancel(){this.cancelled=true;if(!this.done){this.done=true;job.reject(Error('cancelled'))}},
    }
    animations.push(animation);return animation
  }})
  return {controller,paints,animations,statuses}
}
async function finish(f) { for(let i=0;i<5;i++){f.animations.filter(a=>!a.done).forEach(a=>a.finish());await flush()} }

test('numeric cues accept both characters, optional Cut and unchanged dialogue text',()=>{
  assert.deepEqual(parseCharacterCue('拉爾（6/52/3）'),{speaker:'lar',body:6,face:52,transition:3})
  assert.deepEqual(parseCharacterCue('緹芙波（3/34/1）'),{speaker:'tivbo',body:3,face:34,transition:1})
  assert.equal(parseCharacterCue('拉爾（6/52）').transition,0)
  for(const id of [0,1,2,3,4])assert.equal(parseCharacterCue(`拉爾（6/52/${id}）`).transition,id)
  for(const value of ['拉爾（0/1/0）','緹芙波（1/1/5）','拉爾（1/1/-1）','其他（1/1/0）'])assert.throws(()=>parseCharacterCue(value))
  const text='「總之就是這樣子！我們兩個要努力地向大家分享我們喜歡的作品！！」'
  const script=`拉爾（6/52/3）\n\n${text}\n\n緹芙波（3/34/1）\n\n「沒錯！」`
  const lines=parseDialogueScript(script)
  assert.equal(lines[0].text,text);assert.equal(lines[1].text,'「沒錯！」')
  assert.equal(lines[0].transition,3);assert.equal(lines[1].transition,1)
  assert.throws(()=>parseDialogueScript('拉爾（1/1/0）'))
  assert.throws(()=>parseDialogueScript('沒有角色標記'))
})

test('line identity replays identical cues and preserves the other character pose',()=>{
  const lines=normalizeDialogue([
    {speaker:'拉爾（6/52/3）',text:'一'},
    {speaker:'緹芙波（3/34/1）',text:'二'},
    {speaker:'拉爾（6/52/3）',text:'三'},
  ])
  const a=dialoguePortraits(lines,0),b=dialoguePortraits(lines,1),c=dialoguePortraits(lines,2)
  assert.deepEqual(a.lar,b.lar)
  assert.equal(c.lar.cueIndex,2);assert.equal(a.lar.cueIndex,0)
  assert.equal(c.lar.transition,3);assert.equal(c.lar.body,a.lar.body);assert.equal(c.lar.face,a.lar.face)
  assert.deepEqual(c.tivbo,b.tivbo)
  const legacy={speaker:'lar',text:'existing prose',expression:'happy',motion:'greet'}
  assert.deepEqual(normalizeDialogue([legacy])[0],{...legacy,transition:0})
})

for(const mode of [0,1,2,3,4])for(const [name,next] of [['face',pair(1,2)],['body',pair(2,1)],['both',pair(2,2)],['same',pair(1,1)]]) {
  test(`mode ${mode} runs for ${name} assets and returns to base state`,async()=>{
    const f=fixture(),old=pair(1,1)
    await f.controller.request(old,0)
    const request=f.controller.request(next,mode)
    await flush()
    if(mode===1) {
      assert.equal(f.paints.at(-1).current,old,'Flash retains old until white')
      assert.equal(f.animations[0].options.duration,60)
      assert.equal(f.animations[0].layer,'flash')
      assert.equal(f.animations[0].frames.at(-1).opacity,1)
      f.animations[0].finish();await flush()
      assert.equal(f.paints.at(-1).current,next)
      assert.equal(f.animations[1].frames[0].opacity,1)
      assert.equal(f.animations[1].options.duration,140)
    } else if(mode===2) {
      assert.equal(f.paints.at(-1).previous,old)
      assert.deepEqual(f.animations.map(a=>a.layer),['current','previous'])
      assert.ok(f.animations.every(a=>a.options.duration===200))
      assert.equal(f.animations[0].frames[0].opacity,0)
      assert.equal(f.animations[1].frames.at(-1).opacity,0)
    } else if(mode===0)assert.equal(f.animations.length,0)
    else {
      assert.equal(f.paints.at(-1).current,next,'Pop/Shake commit at start')
      assert.equal(f.animations[0].options.duration,portraitTransition(mode).duration)
      assert.equal(f.animations[0].layer,'component')
    }
    await finish(f);await request
    assert.deepEqual(f.paints.at(-1),{current:next,previous:null})
    assert.equal(f.statuses.at(-1)[0],'ready')
    assert.ok(f.animations.every(a=>a.cancelled),'completed animation effects are removed')
  })
}

test('first appearance still executes every explicitly requested mode',async()=>{
  for(const mode of [1,2,3,4]) {
    const f=fixture(),next=pair(1,1),request=f.controller.request(next,mode)
    await flush();assert.ok(f.animations.length>0)
    await finish(f);await request
    assert.equal(f.paints.at(-1).current,next)
  }
})

test('rapid switching cancels a Flash without a late midpoint replacement',async()=>{
  const f=fixture(),old=pair(1,1),abandoned=pair(2,2),latest=pair(3,3)
  await f.controller.request(old)
  const a=f.controller.request(abandoned,1);await flush()
  const first=f.animations[0]
  const b=f.controller.request(latest,4);await flush()
  assert.ok(first.cancelled)
  assert.equal(f.paints.at(-1).current,latest)
  await finish(f);await Promise.all([a,b])
  assert.equal(f.paints.at(-1).current,latest)
  assert.ok(!f.paints.some(p=>p.current===abandoned))
})

test('Crossfade interruption drops old layers, keeps a fully visible current pair while decoding',async()=>{
  const job=deferred(),latest=pair(3,3)
  const f=fixture(url=>url===latest.bodyUrl?job.promise:Promise.resolve())
  await f.controller.request(pair(1,1))
  const middle=pair(2,2),a=f.controller.request(middle,2);await flush()
  const b=f.controller.request(latest,3);await flush()
  assert.deepEqual(f.paints.at(-1),{current:middle,previous:null})
  assert.ok(f.animations.every(a=>a.cancelled))
  job.resolve();await flush();await finish(f);await Promise.all([a,b])
  assert.deepEqual(f.paints.at(-1),{current:latest,previous:null})
})

test('stale/failed decodes and unmount cannot overwrite the displayed character',async()=>{
  const slow=deferred(),bad=deferred()
  const f=fixture(url=>url==='body-2'?slow.promise:url==='body-4'?bad.promise:Promise.resolve())
  const old=pair(1,1),latest=pair(3,3)
  await f.controller.request(old)
  const a=f.controller.request(pair(2,2),3)
  await f.controller.request(latest,0)
  slow.resolve();await a
  assert.equal(f.paints.at(-1).current,latest)
  const b=f.controller.request(pair(4,4),2);bad.reject(Error('decode failed'));await b
  assert.deepEqual(f.paints.at(-1),{current:latest,previous:null})
  assert.equal(f.statuses.at(-1)[0],'error')
  const c=f.controller.request(pair(5,5),3);await flush()
  const count=f.paints.length
  f.controller.cancel(false);await c
  assert.equal(f.paints.length,count,'unmount must not commit more React updates')
})

test('Flash swaps under an opaque inner cover, then reveals only the new pair',async()=>{
  const f=fixture(),old=pair(1,1),next=pair(2,2)
  await f.controller.request(old,0)
  const request=f.controller.request(next,1);await flush()
  const whitening=f.animations[0]
  assert.equal(whitening.layer,'flash')
  assert.equal(f.paints.at(-1).current,old)
  assert.equal(whitening.frames.at(-1).opacity,1)
  assert.equal(whitening.options.fill,'both')
  whitening.finish();await flush()
  assert.deepEqual(f.paints.at(-1),{current:next,previous:null})
  const colour=f.animations[1]
  assert.equal(colour.frames[0].opacity,whitening.frames.at(-1).opacity)
  assert.equal(colour.frames.at(-1).opacity,0)
  assert.equal(whitening.options.duration+colour.options.duration,200)
  assert.ok(f.animations.every(a=>a.layer==='flash' && a.frames.every(frame=>!('filter' in frame) && !('transform' in frame))))
  assert.ok(whitening.cancelled)
  await finish(f);await request
})

test('Pop has three progressively smaller jumps, three landings and exact base endpoints',async()=>{
  const f=fixture(),next=pair(2,2)
  await f.controller.request(pair(1,1))
  const request=f.controller.request(next,3);await flush()
  assert.equal(f.paints.at(-1).current,next)
  const animation=f.animations[0],frames=animation.frames
  assert.equal(animation.options.duration,420)
  assert.equal(animation.layer,'component')
  const apexes=frames.filter(frame=>/translateY\(-/.test(frame.transform))
  assert.equal(apexes.length,3)
  const lift=frame=>Math.abs(Number(frame.transform.match(/translateY\(([-\d.]+)px/)[1]))
  const scale=frame=>Number(frame.transform.match(/scale\(([\d.]+)/)[1])
  assert.ok(lift(apexes[0])>lift(apexes[1]) && lift(apexes[1])>lift(apexes[2]))
  assert.ok(scale(apexes[0])>scale(apexes[1]) && scale(apexes[1])>scale(apexes[2]))
  assert.equal(frames.filter(frame=>frame.offset>0 && frame.transform==='translateY(0px) scale(1)').length,3)
  assert.equal(frames[0].transform,frames.at(-1).transform)
  await finish(f);await request
  assert.ok(animation.cancelled)
  assert.deepEqual(f.paints.at(-1),{current:next,previous:null})
})

test('interrupting Flash after the swap or Pop mid-bounce clears every effect',async()=>{
  for(const mode of [1,3]) {
    const f=fixture(),middle=pair(2,2),latest=pair(3,3)
    await f.controller.request(pair(1,1))
    const request=f.controller.request(middle,mode);await flush()
    if(mode===1){f.animations[0].finish();await flush()}
    const interrupted=[...f.animations]
    await f.controller.request(latest,0)
    await request
    assert.ok(interrupted.every(animation=>animation.cancelled))
    assert.deepEqual(f.paints.at(-1),{current:latest,previous:null})
    assert.equal(f.statuses.at(-1)[0],'ready')
  }
})

test('switching between every animated mode clears both component motion and inner cover',async()=>{
  for(const from of [1,2,3,4])for(const to of [0,1,2,3,4]) {
    const f=fixture(),latest=pair(3,3)
    await f.controller.request(pair(1,1),0)
    const old=f.controller.request(pair(2,2),from);await flush()
    const interrupted=[...f.animations]
    const next=f.controller.request(latest,to);await flush()
    assert.ok(interrupted.every(animation=>animation.cancelled),`${from} -> ${to}`)
    await finish(f);await Promise.all([old,next])
    assert.ok(f.animations.every(animation=>animation.cancelled),`${from} -> ${to} leaves no fill effects`)
    assert.deepEqual(f.paints.at(-1),{current:latest,previous:null})
  }
})
