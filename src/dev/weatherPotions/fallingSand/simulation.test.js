import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MATERIAL as M, POTIONS, RULES, WORLD } from './config.js'
import { createWorld, measureWorld, setInput, snapshotWorld, stepWorld, stopInput } from './simulation.js'
import { change, updateMaterials } from './materials.js'
import { pickWorld } from './terrain.js'
import { climate } from './weather.js'
const run=(world,seconds)=>{for(let i=0;i<Math.ceil(seconds*RULES.fps)&&!world.ending;i++)stepWorld(world);return world}
const pour=(world,type,seconds,point,strength=1)=>{setInput(world,type,point,strength);run(world,seconds);stopInput(world);return world}
const waterMass=w=>[M.WATER,M.SNOW,M.ICE,M.STEAM,M.CLOUD].reduce((sum,kind)=>sum+w.counts[kind],0)
function valid(w) {
  const counts=new Uint32Array(Object.keys(M).length)
  for(let i=0;i<w.material.length;i++) {
    assert.ok(w.material[i]<=M.GROWTH)
    counts[w.material[i]]++
    assert.ok(Number.isFinite(w.temperatureGrid[i]))
    assert.ok(w.moisture[i]>=0 && w.moisture[i]<=1)
  }
  assert.deepEqual(counts,w.counts)
  assert.equal([...counts].reduce((a,b)=>a+b),w.columns*w.rows)
  assert.ok(w.temperature>=-35&&w.temperature<=65)
  for(const key of ['moisture','ice','snow','desert','erosion','damage','floodedLand','permanentLandLoss','flood'])assert.ok(w.metrics[key]>=0&&w.metrics[key]<=1,key)
}
function empty() {
  const w=createWorld({columns:32,rows:32})
  w.material.fill(M.AIR);w.origin.fill(0);w.age.fill(0);w.updated.fill(0);w.counts.fill(0);w.counts[M.AIR]=1024
  w.temperatureGrid.fill(18);w.moisture.fill(.5)
  return w
}
function put(w,x,y,kind,temperature=18) {const i=y*w.columns+x;change(w,i,kind);w.temperatureGrid[i]=temperature;w.origin[i]=kind===M.ROCK?2:0;return i}

test('flooded land recovers after water drains; permanent land loss is cumulative and ignores sand cover',()=>{
  const w=createWorld({columns:48,rows:40}),x=[...w.dryColumns].findIndex(Boolean)
  const surface=w.initialSurface[x]
  for(let y=surface-3;y<surface;y++)put(w,x,y,M.WATER)
  measureWorld(w)
  assert.ok(w.metrics.floodedLand>0)
  assert.equal(w.metrics.permanentLandLoss,0)

  for(let y=surface-3;y<surface;y++)change(w,y*w.columns+x,M.AIR)
  measureWorld(w)
  assert.equal(w.metrics.floodedLand,0)
  assert.equal(w.metrics.permanentLandLoss,0)

  for(let y=surface;y<surface+8;y++)change(w,y*w.columns+x,M.AIR)
  measureWorld(w)
  assert.ok(w.metrics.permanentLandLoss>0)
  const permanent=w.metrics.permanentLandLoss
  for(let y=surface-1;y<surface+2;y++)put(w,x,y,M.SAND)
  measureWorld(w)
  assert.equal(w.metrics.permanentLandLoss,permanent,'new sand must not restore the original land-loss metric')
  valid(w)
})

test('natural rainfall can temporarily flood low land without misreporting broad terrain loss',()=>{
  const w=createWorld()
  run(w,45)
  assert.ok(w.naturalRain>0)
  assert.ok(w.metrics.floodedLand>0)
  assert.ok(w.metrics.permanentLandLoss<.1)
  assert.equal(w.metrics.erosion,0)
  valid(w)
})

test('water really falls, spreads across a basin and cannot tunnel through a wall',()=>{
  const w=empty();for(let x=0;x<32;x++)put(w,x,28,M.ROCK)
  for(let y=0;y<28;y++)put(w,16,y,M.ROCK)
  for(let x=4;x<12;x++)put(w,x,4,M.WATER)
  const before=waterMass(w);run(w,4)
  assert.equal(waterMass(w),before)
  assert.equal(w.counts[M.WATER],8)
  assert.ok(w.material.slice(27*32,28*32).some(v=>v===M.WATER))
  for(let y=0;y<28;y++)for(let x=17;x<32;x++)assert.notEqual(w.material[y*32+x],M.WATER)
  assert.ok(w.moves>0);valid(w)
})
test('soil settles and is less stable than the same unsupported rock',()=>{
  const w=empty();put(w,8,4,M.SOIL);put(w,20,4,M.ROCK);run(w,1)
  assert.equal(w.material[4*32+8],M.AIR);assert.equal(w.material[4*32+20],M.ROCK);valid(w)
})
test('snow accumulates, water freezes progressively and heating returns real liquid',()=>{
  const w=createWorld(),mass=waterMass(w)
  pour(w,'cold',8)
  assert.ok(w.counts[M.ICE]>0 && w.counts[M.WATER]>0 && w.counts[M.SNOW]>0)
  assert.equal(waterMass(w),mass+w.snowAdded+w.rainAdded)
  const ice=w.counts[M.ICE],snow=w.counts[M.SNOW]
  pour(w,'sun',20)
  assert.ok(w.counts[M.ICE]<ice && w.counts[M.SNOW]<snow)
  assert.ok(w.melted>0);valid(w)
})
test('lava contacts water: neither is painted over; water becomes rising steam and lava rock',()=>{
  const w=empty();put(w,10,16,M.WATER);put(w,10,15,M.LAVA,520)
  const mass=waterMass(w);stepWorld(w)
  assert.equal(w.counts[M.LAVA],0);assert.equal(w.counts[M.ROCK],1);assert.equal(w.counts[M.STEAM],1)
  assert.equal(waterMass(w),mass);assert.equal(w.steamCreated,1);assert.equal(w.basaltCreated,1)
  run(w,.4)
  assert.equal(w.material[16*32+10],M.AIR);assert.ok(w.material.slice(0,16*32).some(v=>v===M.STEAM || v===M.CLOUD));valid(w)
})
test('lava heats nearby materials without contact and triggers their existing reactions',()=>{
  const w=empty(),lava=put(w,15,15,M.LAVA,520)
  put(w,14,15,M.ROCK);put(w,12,15,M.ROCK);put(w,13,16,M.ROCK)
  put(w,14,16,M.ROCK);put(w,12,16,M.ROCK)
  const water=put(w,13,15,M.WATER)
  put(w,15,13,M.ROCK);const soil=put(w,15,12,M.SOIL);put(w,15,11,M.ROCK)
  const snow=put(w,15,18,M.SNOW);put(w,15,19,M.ROCK)
  put(w,14,18,M.ROCK);put(w,16,18,M.ROCK);put(w,14,19,M.ROCK);put(w,16,19,M.ROCK)
  const root=put(w,16,17,M.SOIL);put(w,16,18,M.ROCK)
  const plant=put(w,16,16,M.PLANT)
  const distant=put(w,25,15,M.ROCK)
  w.plantRoot[plant]=root+1;w.plantParent[plant]=root+1;w.plantDepth[plant]=1
  const initialSoilMoisture=w.moisture[soil]
  for(let tick=1;tick<=1;tick++) {
    w.tick=tick;w.updated[lava]=tick;updateMaterials(w)
  }
  const warmedWater=w.material.indexOf(M.WATER)
  assert.ok(w.lavaHeat[water]>0)
  assert.ok(w.lavaHeat[snow]>0)
  assert.ok(w.temperatureGrid[warmedWater]>18)
  assert.ok(w.temperatureGrid[soil]>18)
  assert.ok(w.temperatureGrid[plant]>18)
  assert.equal(w.lavaHeat[distant],0,'heat should be limited to the configured radius')
  for(let tick=2;tick<=600;tick++) {
    w.tick=tick;w.updated[lava]=tick;updateMaterials(w)
  }
  assert.ok(w.evaporated>0,'nearby water should evaporate')
  assert.ok(w.melted>0,'nearby snow should melt')
  assert.ok(w.moisture[soil]<initialSoilMoisture,'nearby soil should dry')
  assert.ok(w.plantsWilted>0,'nearby plants should wilt from heat')
  assert.equal(w.material[lava],M.LAVA,'the heat source remains in place')
})
test('lava injection follows pointer and moves along terrain before cooling',()=>{
  const w=createWorld();pour(w,'lava',6,{x:165,y:116})
  assert.ok(w.lavaAdded>0 && w.steamCreated>0 && w.basaltCreated>0)
  assert.ok(w.steamCreated>0 && w.basaltCreated>0)
  const land=pour(createWorld(),'lava',3,{x:55,y:45}),lava=land.counts[M.LAVA]
  assert.ok(lava>0);run(land,40);assert.ok(land.counts[M.LAVA]<lava);assert.ok(land.basaltCreated>0);valid(land);valid(w)
})
test('evaporation, condensation and cloud rain transfer the same water cells',()=>{
  const w=createWorld(),mass=waterMass(w)
  pour(w,'sun',12)
  assert.ok(w.evaporated>0 && w.counts[M.STEAM]>0)
  assert.equal(waterMass(w),mass)
  pour(w,'cold',7);run(w,18)
  assert.ok(w.condensed>0);assert.ok(w.naturalRain>0)
  assert.equal(waterMass(w),mass+w.snowAdded+w.rainAdded)
  valid(w)
})
test('clouds shade sun, wind advects actual cells and wet storms move the sea',()=>{
  const clear=createWorld(),cloudy=createWorld()
  pour(clear,'sun',6);pour(cloudy,'cloud',6);pour(cloudy,'sun',6)
  assert.ok(cloudy.light<clear.light && cloudy.temperature<clear.temperature)
  const w=createWorld();pour(w,'rain',7);pour(w,'cloud',3);pour(w,'wind',8)
  assert.ok(w.windMoves>20 && w.storm>.25);valid(w)
})
test('rain then sun reveals a rainbow; the dedicated bottle also works',()=>{
  const w=createWorld();pour(w,'rain',5);pour(w,'sun',7);assert.ok(w.rainbow>.05)
  const magic=pour(createWorld(),'rainbow',4);assert.ok(magic.rainbow>.5)
  const dry=createWorld();dry.light=80;dry.rainbow=.5;climate(dry,1/RULES.fps)
  assert.ok(dry.rainbow<.5,'a rainbow fades without recent rain')
  const cloudy=createWorld();cloudy.rainMemory=.5;cloudy.cloudiness=.9;cloudy.light=80
  climate(cloudy,1/RULES.fps)
  assert.equal(cloudy.rainbow,0,'dense cloud cover masks the natural rainbow')
})
test('all nine stop their input immediately, while existing matter continues moving',()=>{
  for(const p of POTIONS) {
    const w=pour(createWorld(),p.id,4),doses={...w.doses},injected=w.injected,moves=w.moves
    run(w,3)
    assert.equal(w.input,null);assert.equal(w.injected,injected,p.id);assert.deepEqual(w.doses,doses,p.id)
    if(['rain','cold','lava','cloud'].includes(p.id))assert.ok(w.moves>moves)
    valid(w)
  }
})
test('brief gentle experiments do not become forced endings',()=>{
  for(const p of POTIONS){const w=pour(createWorld(),p.id,6,undefined,RULES.defaultStrength);run(w,90);assert.equal(w.ending,null,p.id);valid(w)}
})
test('five endings emerge from full-size actual simulations, freeze and reset',()=>{
  const results=[]
  for(const [p,expected]of [['rain','noah'],['cold','ice'],['sun','sahara']]){
    const w=createWorld();setInput(w,p,undefined,1);run(w,160)
    assert.equal(w.ending,expected);assert.ok(w.time>=RULES.graceSeconds)
    if(expected==='noah') {
      assert.ok(w.metrics.floodedLand>.62)
      assert.ok(w.metrics.flood>.23)
      assert.ok(w.metrics.permanentLandLoss<.62)
    }
    const before=JSON.stringify(snapshotWorld(w)),grid=w.material.slice();setInput(w,'rain');run(w,3)
    assert.equal(JSON.stringify(snapshotWorld(w)),before);assert.deepEqual(w.material,grid);valid(w);results.push(expected)
  }
  const sea=pour(createWorld(),'rain',30);const rain=sea.rainAdded;run(sea,180)
  assert.equal(sea.ending,'atlantis');assert.equal(sea.rainAdded,rain);assert.ok(sea.metrics.erosion>.025)
  assert.ok(sea.metrics.permanentLandLoss>.18);valid(sea);results.push(sea.ending)
  const broken=createWorld()
  for(let phase=0;phase<8&&!broken.ending;phase++){
    const p=phase%2?'cold':'sun';setInput(broken,p,undefined,1)
    for(let i=0;i<2400&&!broken.ending;i++){stepWorld(broken);if(p==='sun'?broken.temperature>=49:broken.temperature<=-15)break}
  }
  stopInput(broken);run(broken,80);assert.equal(broken.ending,'apocalypse');assert.ok(broken.disasters.size>=2);assert.ok(broken.disasters.has('heatwave'));valid(broken);results.push(broken.ending)
  assert.equal(new Set(results).size,5)
  const initial=createWorld(),reset=createWorld();assert.deepEqual(reset.material,initial.material);assert.equal(reset.ending,null);assert.equal('observations' in reset,false);assert.equal('observed' in reset,false)
})
test('fixed steps, pointer mapping, invalid input and rapid changes stay bounded',()=>{
  const w=createWorld(),tick=w.tick;stepWorld(w,NaN);stepWorld(w,-1);assert.equal(w.tick,tick)
  stepWorld(w,1/60);assert.equal(w.tick,tick);stepWorld(w,1/60);assert.equal(w.tick,tick+1)
  stepWorld(w,100);assert.equal(w.tick,tick+2)
  for(let i=0;i<1200;i++){setInput(w,POTIONS[i%POTIONS.length].id,{x:i%w.columns,y:(i*7)%w.rows});stepWorld(w);if(i%3===0)stopInput(w)}
  const before=w.input;setInput(w,'unknown');setInput(w,'rain',{x:NaN,y:0});assert.equal(w.input,before)
  assert.equal(pickWorld(w,{x:-1,y:0}),null)
  assert.deepEqual(pickWorld(w,{x:WORLD.width*.5,y:WORLD.height*.5}),{x:105,y:85})
  measureWorld(w);valid(w)
})
