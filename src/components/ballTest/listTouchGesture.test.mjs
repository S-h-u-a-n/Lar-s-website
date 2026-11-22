import test from 'node:test'
import assert from 'node:assert/strict'
import { createListTouchGesture } from './listTouchGesture.js'

function setup() {
  const steps = [], capture = new Set()
  let time = 0
  const handlers = createListTouchGesture({onStep:value=>steps.push(value),now:()=>time})
  const target = {
    setPointerCapture:id=>capture.add(id),
    hasPointerCapture:id=>capture.has(id),
    releasePointerCapture:id=>capture.delete(id),
  }
  const event = (x,y,patch={}) => ({ pointerId:1,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,cancelable:true,currentTarget:target,detail:1,
    preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},...patch })
  return {handlers,steps,capture,event,advance:ms=>time+=ms}
}

test('vertical swipes use single-work navigation, prevent accidental card activation and release capture', () => {
  const {handlers:h,steps,event:e,capture,advance} = setup()
  h.onPointerDown(e(40,100)); h.onPointerMove(e(42,40)); h.onPointerUp(e(42,40))
  assert.deepEqual(steps,[1]); assert.equal(capture.size,0)
  const click = e(42,40)
  h.onClickCapture(click)
  assert.equal(click.prevented,true); assert.equal(click.stopped,true)
  advance(500)
  const nextClick = e(42,40)
  h.onClickCapture(nextClick); assert.equal(nextClick.prevented,undefined)
  h.onPointerDown(e(40,40)); h.onPointerMove(e(40,100)); h.onPointerUp(e(40,100))
  assert.deepEqual(steps,[1,-1])
})

test('taps, horizontal gestures, desktop mouse and keyboard retain their own behavior', () => {
  const {handlers:h,steps,event:e} = setup()
  h.onPointerDown(e(20,20)); h.onPointerUp(e(22,23))
  const tap = e(22,23); h.onClickCapture(tap); assert.equal(tap.prevented,undefined)
  h.onPointerDown(e(20,20)); h.onPointerMove(e(100,21)); h.onPointerUp(e(100,21))
  h.onPointerDown(e(20,20,{pointerType:'mouse'})); h.onPointerMove(e(20,100,{pointerType:'mouse'})); h.onPointerUp(e(20,100,{pointerType:'mouse'}))
  assert.deepEqual(steps,[])
  const keyboard = e(20,20,{detail:0}); h.onClickCapture(keyboard); assert.equal(keyboard.prevented,undefined)
})

test('pinch, pointer cancellation and short drags do not navigate or leave a stuck gesture', () => {
  const {handlers:h,steps,event:e,capture} = setup()
  h.onPointerDown(e(0,100)); h.onPointerMove(e(0,30))
  h.onPointerDown(e(10,80,{pointerId:2,isPrimary:false})); h.onPointerUp(e(0,30))
  assert.deepEqual(steps,[])
  assert.equal(capture.size,0,'a second finger releases the old swipe capture')
  h.onPointerDown(e(0,100)); h.onPointerMove(e(0,20)); h.onPointerCancel(e(0,20))
  assert.deepEqual(steps,[]); assert.equal(capture.size,0)
  h.onPointerDown(e(0,100)); h.onPointerMove(e(0,80)); h.onPointerUp(e(0,80))
  assert.deepEqual(steps,[])
  h.onPointerDown(e(0,100)); h.onPointerMove(e(0,20)); h.onPointerUp(e(0,20))
  assert.deepEqual(steps,[1])
  h.onPointerDown(e(0,20)); h.onPointerUp(e(0,20))
  const tap = e(0,20); h.onClickCapture(tap)
  assert.equal(tap.prevented,undefined,'a fresh intentional tap is allowed immediately after a swipe')
})

test('rapid alternating swipes send exactly one command per completed gesture', () => {
  const {handlers:h,steps,event:e} = setup()
  for(let i=0;i<30;i++) {
    const y = i%2 ? 160 : 40
    h.onPointerDown(e(40,100)); h.onPointerMove(e(40,y)); h.onPointerUp(e(40,y))
    h.onLostPointerCapture(e(40,y))
  }
  assert.equal(steps.length,30)
  assert.deepEqual(steps.slice(0,4),[1,-1,1,-1])
})
