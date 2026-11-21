import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MATERIAL as M, POTIONS, RULES as R } from './config.js'
import { createWorld, measureWorld, setInput, stepWorld, stopInput } from './simulation.js'
import { change, updateMaterials } from './materials.js'
import { paintStroke } from './brush.js'
import { seedPlant, plantLimit } from './plants.js'
import { evaluateEnding } from './endings.js'

function empty() {
  const w=createWorld({columns:48,rows:40})
  w.material.fill(M.AIR);w.counts.fill(0);w.counts[M.AIR]=w.material.length
  w.origin.fill(0);w.age.fill(0);w.updated.fill(0);w.temperatureGrid.fill(18);w.moisture.fill(.65)
  return w
}
function put(w,x,y,kind,temp=18) {const i=y*w.columns+x;change(w,i,kind);w.temperatureGrid[i]=temp;w.origin[i]=kind===M.ROCK?2:0;return i}
function ground(w) {
  for(let y=25;y<w.rows;y++)for(let x=0;x<w.columns;x++)put(w,x,y,M.ROCK)
  for(let x=0;x<w.columns;x++)put(w,x,24,M.SOIL)
  return w
}
function run(w,seconds){for(let n=0;n<seconds*R.fps;n++)stepWorld(w)}
const water=w=>[M.WATER,M.ICE,M.SNOW,M.STEAM,M.CLOUD].reduce((n,k)=>n+w.counts[k],0)
function valid(w) {
  const counts=new Uint32Array(w.counts.length)
  for(const kind of w.material)counts[kind]++
  assert.deepEqual(counts,w.counts)
  assert.equal([...counts].reduce((a,b)=>a+b),w.material.length)
}

test('sand falls, spreads into a pile and cannot cross solid soil or rock',()=>{
  const w=ground(empty())
  for(let y=2;y<20;y++)put(w,20,y,M.SAND)
  run(w,5)
  assert.equal(w.counts[M.SAND],18)
  assert.ok(w.material.slice(20*48,24*48).includes(M.SAND))
  assert.ok(new Set([...w.material].flatMap((k,i)=>k===M.SAND?[i%48]:[])).size>1)
  for(let y=25;y<40;y++)for(let x=0;x<48;x++)assert.equal(w.material[y*48+x],M.ROCK)
  assert.ok(!w.material.slice(24*48).includes(M.SAND));valid(w)
})
test('sand sinks through water, water is conserved and wet grains are transported',()=>{
  const w=ground(empty())
  for(let y=12;y<24;y++)for(let x=2;x<46;x++)put(w,x,y,M.WATER)
  for(let x=10;x<30;x++)put(w,x,8,M.SAND)
  const mass=water(w);run(w,8)
  assert.equal(w.counts[M.SAND],20);assert.equal(water(w),mass)
  assert.ok(w.material.slice(22*48,24*48).includes(M.SAND))
  assert.ok(w.sandWaterMoves>0);valid(w)
})
test('dry exposed sand is windborne; cold preserves sand; sustained lava contact sinters only locally',()=>{
  const windy=ground(empty());for(let x=10;x<30;x++){const i=put(windy,x,23,M.SAND);windy.moisture[i]=0}
  windy.wind=1;run(windy,3);assert.ok(windy.sandWindMoves>0)
  const cold=ground(empty());for(let x=10;x<20;x++)put(cold,x,23,M.SAND,-30)
  cold.temperature=-30;run(cold,3);assert.equal(cold.counts[M.SAND],10)
  const hot=ground(empty()),i=put(hot,20,23,M.SAND,300)
  put(hot,19,23,M.ROCK);put(hot,21,23,M.ROCK);put(hot,20,22,M.LAVA,520)
  const far=put(hot,30,23,M.SAND)
  for(let tick=1;tick<=R.sandSinterTicks+1;tick++){
    hot.tick=tick;put(hot,20,22,M.LAVA,520);hot.temperatureGrid[i]=300;updateMaterials(hot)
  }
  assert.equal(hot.material[i],M.ROCK);assert.equal(hot.material[far],M.SAND);assert.equal(hot.sandSintered,1)
  valid(hot);valid(cold);valid(windy)
})
test('growth requires a moist substrate, stops at rock/water and permits thin moist sand over soil',()=>{
  const w=ground(empty());assert.ok(seedPlant(w,20,8));assert.equal(w.material[23*48+20],M.PLANT)
  const air=empty();assert.equal(seedPlant(air,20,8),false)
  const rock=ground(empty());put(rock,20,20,M.ROCK);assert.equal(seedPlant(rock,20,8),false)
  const submerged=ground(empty());put(submerged,20,23,M.WATER);assert.equal(seedPlant(submerged,20,8),false)
  const sand=ground(empty());const i=put(sand,20,23,M.SAND);sand.moisture[i]=.5
  assert.ok(seedPlant(sand,20,8));valid(sand)
})
test('plants grow gradually with variation and respect depth, spread and global limits',()=>{
  const w=ground(empty());for(let x=5;x<44;x+=4)seedPlant(w,x,3)
  const initial=w.counts[M.PLANT];run(w,35)
  assert.ok(w.counts[M.PLANT]>initial);assert.ok(w.counts[M.PLANT]<=plantLimit(w))
  for(let i=0;i<w.material.length;i++)if(w.material[i]===M.PLANT){
    assert.ok(w.plantDepth[i]<=R.plantMaxDepth)
    assert.ok(Math.abs(i%48-(w.plantRoot[i]-1)%48)<=R.plantSpread)
  }
  const count=w.counts[M.PLANT];run(w,60);assert.ok(w.counts[M.PLANT]<=plantLimit(w));assert.ok(count>0);valid(w)
})
test('cold pauses growth; severe cold, drought and heat wilt plants; light and moisture improve growth',()=>{
  const make=()=>{const w=ground(empty());seedPlant(w,20,5);return w}
  const warm=make(),cold=make(),shade=make()
  for(const [w,temp,light]of [[warm,18,85],[cold,0,85],[shade,18,5]]){
    w.temperature=temp;w.light=light;w.temperatureGrid.fill(temp)
    for(let n=0;n<300;n++){w.tick++;updateMaterials(w)}
  }
  assert.ok(warm.counts[M.PLANT]>cold.counts[M.PLANT]);assert.equal(cold.counts[M.PLANT],1);assert.equal(shade.counts[M.PLANT],1)
  for(const type of ['dry','cold','hot']){
    const w=make();w.temperature=type==='cold'?-35:type==='hot'?65:18
    w.temperatureGrid.fill(w.temperature)
    if(type==='dry')w.moisture.fill(0)
    run(w,20);assert.equal(w.counts[M.PLANT],0,type);assert.ok(w.plantsWilted>0);valid(w)
  }
})
test('sand burial and lava destroy plants without adding water or erosion damage',()=>{
  for(const kind of [M.SAND,M.LAVA]){
    const w=ground(empty());seedPlant(w,20,8);put(w,20,22,kind,kind===M.LAVA?520:18)
    const mass=water(w);run(w,3)
    assert.ok(w.plantsWilted>0);assert.equal(w.counts[M.PLANT],0);assert.equal(water(w),mass);assert.equal(w.fractured,0);valid(w)
  }
})
test('all nine potions accept tap, continuous brush and keyboard-style input, and stop injection',()=>{
  assert.deepEqual(POTIONS.map(p=>p.id),['rain','sun','cold','wind','cloud','lava','rainbow','growth','sand'])
  for(const p of POTIONS)for(const mode of ['brush','weather']){
    const w=ground(empty()),point={x:20,y:10}
    paintStroke(w,p.id,null,point,1,true,'large')
    setInput(w,p.id,{...point,mode,brushSize:'large'},1);run(w,1)
    assert.equal(w.input.type,p.id)
    if(p.id==='sand')assert.ok(w.sandAdded>0)
    if(p.id==='growth')assert.ok(w.growthAdded>0)
    stopInput(w);const injected=w.injected,doses={...w.doses};run(w,1)
    assert.equal(w.injected,injected);assert.deepEqual(w.doses,doses);valid(w)
  }
})
test('new materials do not pollute ending metrics, and reset removes them',()=>{
  const initial=createWorld(),w=createWorld(),metrics={...w.metrics}
  paintStroke(w,'sand',null,{x:80,y:20},1,true)
  paintStroke(w,'growth',null,{x:40,y:20},1,true)
  measureWorld(w,true)
  assert.deepEqual(w.metrics,metrics)
  w.time=100
  for(let i=0;i<300;i++)evaluateEnding(w,1/R.fps)
  assert.equal(w.ending,null)
  const reset=createWorld();assert.deepEqual(reset.material,initial.material)
  assert.equal(reset.counts[M.SAND],0);assert.equal(reset.counts[M.PLANT],0);assert.equal(reset.sandAdded,0);assert.equal(reset.plantsSeeded,0)
  valid(w);valid(reset)
})

test('growth potion emits gravity-driven grains, never directly plants, and leaves no note state',()=>{
  const w=ground(empty())
  const count=paintStroke(w,'growth',null,{x:20,y:8},1,true)
  assert.ok(count>0);assert.ok(w.counts[M.GROWTH]>0);assert.equal(w.counts[M.PLANT],0)
  const before=[...w.material].flatMap((k,i)=>k===M.GROWTH?[Math.floor(i/48)]:[])
  stepWorld(w)
  const after=[...w.material].flatMap((k,i)=>k===M.GROWTH?[Math.floor(i/48)]:[])
  assert.ok(after.reduce((a,b)=>a+b)/after.length>before.reduce((a,b)=>a+b)/before.length)
  assert.equal('observed' in w,false);assert.equal('observations' in w,false);valid(w)
})
test('water consumes a growth grain without consuming water, and activates nearby suitable soil',()=>{
  const w=ground(empty())
  put(w,20,23,M.GROWTH);put(w,21,23,M.WATER)
  const mass=water(w);stepWorld(w)
  assert.equal(w.counts[M.GROWTH],0);assert.equal(w.growthConsumed,1);assert.equal(water(w),mass)
  assert.equal(w.counts[M.PLANT],1);assert.equal(w.plantsSeeded,1)
  const injected=w.injected;run(w,12);assert.equal(w.injected,injected);assert.ok(w.counts[M.PLANT]>1);valid(w)
})
test('water activation cannot grow plants in empty water, through rock or on unsuitable dry soil',()=>{
  for(const mode of ['rock','dry','wall','empty']){
    const w=empty()
    if(mode!=='empty')for(let x=0;x<48;x++)put(w,x,24,mode==='dry'?M.SOIL:M.ROCK)
    if(mode==='dry')w.moisture.fill(0)
    if(mode==='wall'){
      for(let y=0;y<40;y++)put(w,22,y,M.ROCK)
      put(w,23,24,M.SOIL)
    }
    put(w,20,23,M.GROWTH);put(w,21,23,M.WATER)
    // Keep the water contact stable for this reaction-only fixture.
    w.tick++;w.updated[23*48+21]=w.tick;updateMaterials(w)
    assert.equal(w.growthConsumed,1,mode);assert.equal(w.counts[M.GROWTH],0,mode)
    assert.equal(w.counts[M.PLANT],0,mode);valid(w)
  }
})
test('growth grains have a lifetime and population cap, and reset removes grains and counters',()=>{
  const w=ground(empty())
  setInput(w,'growth',{x:20,y:10,mode:'brush',brushSize:'large'},1)
  run(w,25);stopInput(w)
  assert.ok(w.counts[M.GROWTH]<=Math.min(R.growthMaxParticles,Math.ceil(w.material.length*.02)))
  assert.equal(w.counts[M.PLANT],0)
  run(w,R.growthLifetime+1)
  assert.equal(w.counts[M.GROWTH],0);assert.ok(w.growthExpired>0)
  const reset=createWorld();assert.equal(reset.counts[M.GROWTH],0);assert.equal(reset.growthAdded,0);assert.equal(reset.growthConsumed,0)
  valid(w);valid(reset)
})
