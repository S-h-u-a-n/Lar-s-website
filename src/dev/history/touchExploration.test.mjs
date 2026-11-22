import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { eraStops, nextEra, createHistoryTouch } from './touchExploration.js'
import { HISTORY_LABELS } from './labels.js'

const placements=JSON.parse(fs.readFileSync(new URL('./placements.json',import.meta.url)))
const stops=eraStops(placements,HISTORY_LABELS)
test('chronological stops use all eighteen actual people, not lexical asset order, with unchanged endpoints',()=>{
  assert.deepEqual(stops.map(s=>s.id),Array.from({length:18},(_,i)=>`people-${i+1}`))
  assert.equal(stops[0].camera,1);assert.equal(stops.at(-1).camera,0)
  for(let i=1;i<stops.length;i++)assert.ok(stops[i].camera<stops[i-1].camera)
  assert.equal(nextEra(stops,1,true),stops[1].camera)
  assert.equal(nextEra(stops,0,true),0)
  assert.equal(nextEra(stops,1,false),1)
  assert.equal(nextEra(stops,stops[9].camera,false),stops[8].camera)
})

function fixture(callbacks={}) {
  const capture=new Set(),taps=[],swipes=[]
  const target={setPointerCapture:id=>capture.add(id),hasPointerCapture:id=>capture.has(id),releasePointerCapture:id=>capture.delete(id)}
  const controller=createHistoryTouch({tap:(...v)=>taps.push(v),swipe:(...v)=>swipes.push(v),now:()=>100,...callbacks})
  const event=(x,y,extra={})=>({pointerId:1,pointerType:'touch',button:0,isPrimary:true,clientX:x,clientY:y,currentTarget:target,target:{closest:()=>false},detail:1,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},...extra})
  return {controller,event,capture,taps,swipes}
}
test('a tap is delivered once, jitter is allowed, and synthetic click cannot activate another feature',()=>{
  const {controller:c,event:e,taps,swipes,capture}=fixture()
  c.start(e(10,20));c.move(e(12,22));c.end(e(12,22));c.end(e(12,22))
  assert.deepEqual(taps,[[12,22]]);assert.deepEqual(swipes,[]);assert.equal(capture.size,0)
  const click=e(12,22);c.click(click);assert.equal(click.prevented,true)
  const keyboard=e(0,0,{detail:0});c.click(keyboard);assert.equal(keyboard.prevented,undefined)
})
test('right swipe advances once on release; left swipe reverses; long gestures cannot skip eras',()=>{
  const {controller:c,event:e,swipes,taps}=fixture()
  c.start(e(50,50));for(let x=60;x<=1000;x+=10)c.move(e(x,50))
  assert.equal(swipes.length,0)
  c.end(e(1000,50));c.end(e(1000,50));assert.deepEqual(swipes,[[true,950]])
  c.start(e(100,50));c.move(e(20,50));c.end(e(20,50))
  assert.deepEqual(swipes.at(-1),[false,80]);assert.deepEqual(taps,[])
})
test('short/vertical drags, out-and-back movement, pinch and cancellation neither tap nor navigate',()=>{
  for(const end of [[20,0],[20,100],[0,0]]) {
    const {controller:c,event:e,taps,swipes}=fixture()
    c.start(e(0,0));c.move(e(20,100));c.end(e(...end))
    assert.deepEqual(taps,[]);assert.deepEqual(swipes,[])
  }
  const {controller:c,event:e,capture,taps,swipes}=fixture()
  c.start(e(0,0));c.start(e(20,0,{pointerId:2,isPrimary:false}));c.end(e(100,0))
  assert.equal(capture.size,0)
  c.start(e(0,0));c.cancel(e(100,0));c.end(e(100,0))
  assert.deepEqual(taps,[]);assert.deepEqual(swipes,[])
  c.start(e(0,0,{pointerType:'mouse'}));c.end(e(100,0,{pointerType:'mouse'}))
  assert.deepEqual(swipes,[])
})

test('actual page touch callbacks reuse hover selection, close on blank, reset on swipe and leave desktop wheel separate',()=>{
  const source=fs.readFileSync(new URL('./HistoryTest.jsx',import.meta.url),'utf8')
  const block=source.slice(source.indexOf('    const touch = createHistoryTouch('),source.indexOf('    function preference()'))
  const context={createHistoryTouch,nextEra,stops,disabledRef:{current:false},ready:true,touchMode:false,touchSelected:-1,hovered:-1,pointerIntent:true,mouse:[0,0],lastPointer:null,ignoreMouseUntil:0,lastWheel:0,arrowDismissed:false,entryRequested:0,target:1,camera:1,touchTransition:null,
    performance:{now:()=>100},pickPerson:x=>x===10?3:x===20?7:-1,request(){},gesture:{input:()=>false},requestEntry(){throw Error('Unexpected entry')},arrow:{current:{dataset:{}}},
  }
  vm.createContext(context)
  vm.runInContext(block+'\nglobalThis.input=touch',context)
  const {event:e}=fixture()
  for(const [x,expected] of [[10,3],[20,7],[99,-1]]) {
    context.input.start(e(x,0));context.input.end(e(x,0));assert.equal(context.touchSelected,expected);assert.equal(context.hovered,expected)
  }
  context.input.start(e(0,0));context.input.move(e(100,0));context.input.end(e(100,0))
  assert.equal(context.target,stops[1].camera);assert.equal(context.touchSelected,-1)
  context.input.start(e(0,0));context.input.move(e(100,0));context.input.end(e(100,0))
  assert.equal(context.target,stops[2].camera)
  assert.ok(source.includes('const travel = Math.abs(dx) > Math.abs(dy) ? dx : -dy'),'desktop wheel mapping remains intact')
})
