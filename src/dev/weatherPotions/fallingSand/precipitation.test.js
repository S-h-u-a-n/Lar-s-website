import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MATERIAL as M, RULES as R } from './config.js'
import { createWorld, setInput, stepWorld } from './simulation.js'
import { spawnAt, precipitationTemperature, precipitationMaterial, snowProbability, applyLocalTemperature } from './weather.js'
import { change } from './materials.js'
import { paintStroke } from './brush.js'

function empty(){
  const w=createWorld({columns:60,rows:60});w.material.fill(M.AIR);w.counts.fill(0);w.counts[M.AIR]=3600
  w.updated.fill(0);w.origin.fill(0);w.age.fill(0);w.temperatureGrid.fill(18);return w
}
const mass=w=>[M.WATER,M.SNOW,M.ICE,M.STEAM,M.CLOUD].reduce((n,k)=>n+w.counts[k],0)
function ratio(temp){const w=createWorld();let snow=0;for(let n=0;n<10000;n++)snow+=precipitationMaterial(w,temp)===M.SNOW;return snow/10000}

test('snow fraction follows temperature continuously, with only a narrow freezing-point mix',()=>{
  assert.equal(ratio(-5),1);assert.equal(ratio(5),0)
  const values=[-.75,0,.75].map(ratio)
  assert.ok(values[0]>.8 && values[1]>.45 && values[1]<.55 && values[2]<.2)
  assert.ok(values[0]>values[1] && values[1]>values[2])
  assert.equal(snowProbability(-1),1);assert.equal(snowProbability(1),0)
})
test('rain sources use the live local formation temperature',()=>{
  for(const type of ['rain'])for(const temp of [-10,10]){
    const w=empty();w.temperature=temp
    assert.ok(spawnAt(w,type,20,45,true))
    assert.equal(w.material[45*60+20],temp<0?M.SNOW:M.WATER)
    assert.equal(w.temperatureGrid[45*60+20],temp)
  }
  const w=empty();w.temperature=10
  applyLocalTemperature(w,45*60+20,-20)
  assert.equal(precipitationTemperature(w,20,45),-10)
  spawnAt(w,'rain',20,45,true);assert.equal(w.material[45*60+20],M.SNOW)
})
test('cold brush retains its local cooling alongside direct magical snowfall',()=>{
  const w=createWorld();w.temperature=1
  paintStroke(w,'cold',null,{x:150,y:100},1,true)
  assert.ok(w.snowAdded>w.rainAdded);assert.equal(w.material[100*w.columns+150],M.SNOW)
  const offset=w.thermalOffset[100*w.columns+150]
  assert.ok(offset<0);w.tick+=R.fps*R.localThermalSeconds
  assert.ok(precipitationTemperature(w,150,100)>w.temperature+offset)
})
test('cloud precipitation uses live air rather than its stale particle temperature',()=>{
  for(const temp of [-10,35]){
    const w=empty();w.temperature=temp
    for(let y=10;y<15;y++)for(let x=10;x<20;x++){
      const i=y*60+x;change(w,i,M.CLOUD);w.age[i]=400;w.temperatureGrid[i]=temp<0?40:-30
    }
    const before=mass(w)
    for(let n=0;n<90;n++)stepWorld(w)
    assert.ok(w.naturalRain>0)
    if(temp<0)assert.ok(w.counts[M.SNOW]>0)
    else assert.equal(w.counts[M.SNOW],0)
    assert.equal(mass(w),before)
  }
})
test('airborne rain becomes snow in cold air without freezing the sky into ice',()=>{
  const w=empty();w.temperature=-25
  spawnAt(w,'rain',20,8,true)
  // Start as an already-formed warm raindrop, entering a newly cold air mass.
  change(w,8*60+20,M.WATER);w.temperatureGrid[8*60+20]=12;w.origin[8*60+20]=4
  for(let n=0;n<15;n++)stepWorld(w)
  assert.equal(w.counts[M.SNOW],1);assert.equal(w.counts[M.ICE],0);assert.equal(mass(w),1)
})
test('snow melts in warm air and all phase changes conserve water-family cells',()=>{
  const w=empty();w.temperature=30
  for(let x=5;x<55;x++){change(w,5*60+x,M.SNOW);w.temperatureGrid[5*60+x]=25;w.origin[5*60+x]=4}
  for(let n=0;n<60;n++)stepWorld(w)
  assert.ok(w.melted>0);assert.ok(w.counts[M.WATER]>0);assert.equal(mass(w),50)
})
test('cold potion immediately produces only snow at warm temperatures while retaining global cooling',()=>{
  const w=createWorld();w.temperature=30
  setInput(w,'cold',{x:150,y:100,mode:'brush',brushSize:'medium'},1)
  for(let n=0;n<5*R.fps;n++)stepWorld(w)
  assert.ok(w.snowAdded>0);assert.equal(w.rainAdded,0);assert.ok(w.temperature<30)
})
test('magical snow remains snow while airborne in warm air; ordinary snow still melts',()=>{
  const magic=empty(),ordinary=empty()
  for(const w of [magic,ordinary]){
    w.temperature=35
    for(let x=5;x<55;x++)spawnAt(w,'cold',x,3,true)
  }
  for(let i=0;i<ordinary.material.length;i++)if(ordinary.material[i]===M.SNOW)ordinary.origin[i]=4
  for(let n=0;n<60;n++){stepWorld(magic);stepWorld(ordinary)}
  assert.equal(magic.counts[M.SNOW],50);assert.equal(magic.melted,0)
  assert.ok(ordinary.melted>0);assert.equal(mass(magic),50);assert.equal(mass(ordinary),50)
})
test('magical snow visibly accumulates, waits after settling, then thaws gradually without changing water mass',()=>{
  const w=empty();w.temperature=35
  for(let x=0;x<60;x++){const i=48*60+x;change(w,i,M.ROCK);w.origin[i]=2}
  for(let x=5;x<55;x++)spawnAt(w,'cold',x,47,true)
  for(let n=0;n<5*R.fps;n++)stepWorld(w)
  assert.equal(w.counts[M.SNOW],50);assert.equal(w.melted,0)
  for(let n=0;n<4*R.fps;n++)stepWorld(w)
  assert.ok(w.counts[M.SNOW]>0 && w.counts[M.SNOW]<50);assert.ok(w.melted>0)
  assert.equal(mass(w),50)
  for(let n=0;n<40*R.fps;n++)stepWorld(w)
  assert.equal(w.counts[M.SNOW],0);assert.equal(mass(w),50)
})
