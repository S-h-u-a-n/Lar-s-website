import test from 'node:test'
import assert from 'node:assert/strict'
import { labelPosition, personContour, personAnchor } from './labelPosition.js'
const settings={gap:14,edge:16},size={width:220,height:64},viewport={width:1200,height:800}
const anchor={left:{x:400,y:430},right:{x:520,y:430}}
test('lower-left paper corner remains 14px from the current right contour',()=>{
  const p=labelPosition(anchor,size,viewport,settings)
  assert.equal(p.side,'upper-right')
  assert.ok(Math.abs(Math.hypot(p.x-anchor.right.x,p.y+p.height-anchor.right.y)-14)<1e-9)
})
test('only a viewport edge can switch the label to the matching left contour',()=>{
  const a={left:{x:1030,y:430},right:{x:1170,y:430}}
  const p=labelPosition(a,size,viewport,settings)
  assert.equal(p.side,'upper-left')
  assert.ok(Math.abs(Math.hypot(a.left.x-p.x-p.width,a.left.y-p.y-p.height)-14)<1e-9)
  const top=labelPosition({left:{x:400,y:30},right:{x:520,y:30}},size,viewport,settings)
  assert.equal(top.side,'upper-right');assert.equal(top.y,16)
})
test('head contour excludes transparent padding and a distant lower-body weapon',()=>{
  const w=40,h=60,bits=new Uint8Array(w*h/8)
  const set=(x,y)=>{const n=y*w+x;bits[n>>3]|=128>>(n&7)}
  for(let y=10;y<50;y++)for(let x=15;x<25;x++)set(x,y)
  for(let x=25;x<39;x++)set(x,40)
  const contour=personContour({maskWidth:w,maskHeight:h},bits)
  assert.equal(contour.right.x,25/w)
  const pose={x:400,y:0,width:200,height:300,origin:[50,97]}
  const a=personAnchor(contour,pose,1.1)
  assert.deepEqual(a,personAnchor(contour,{...pose,rotateX:3,rotateZ:6,scale:1.05},1.1))
  const b=personAnchor(contour,{...pose,x:300},1.1)
  assert.ok(Math.abs(a.right.x-100-b.right.x)<1e-9)
})
