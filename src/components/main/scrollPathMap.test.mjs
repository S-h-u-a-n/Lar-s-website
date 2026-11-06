import test from 'node:test'
import assert from 'node:assert/strict'
import { createScrollPathMap } from './scrollPathMap.js'

test('straight path follows viewport height and clamps to its ends',()=>{
  const map=createScrollPathMap([{length:0,y:0},{length:100,y:100},{length:200,y:200}])
  for(const y of [0,20,80,160,200])assert.ok(Math.abs(map(y)-y)<1e-9)
  assert.equal(map(-50),0);assert.equal(map(400),200)
})
test('a backtracking loop has continuous, monotone, reversible scroll progress',()=>{
  const map=createScrollPathMap([{length:0,y:0},{length:100,y:100},{length:200,y:60},{length:300,y:40},{length:400,y:110},{length:500,y:200}])
  const forward=Array.from({length:2001},(_,i)=>map(i/10))
  forward.forEach((value,i)=>{assert.ok(Number.isFinite(value));if(i){assert.ok(value>=forward[i-1]);assert.ok(value-forward[i-1]<5)}})
  for(let i=2000;i>=0;i--)assert.equal(map(i/10),forward[i])
  // The slope matches on either side of every sampled height, including loop pooling.
  for(let y=1;y<199;y+=.2){const h=.0001;const before=(map(y)-map(y-h))/h,after=(map(y+h)-map(y))/h;assert.ok(Math.abs(before-after)<.02)}
})
