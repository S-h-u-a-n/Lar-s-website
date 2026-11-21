import assert from 'node:assert/strict'
import { test } from 'node:test'
import { POTIONS, RULES, WORLD } from './config.js'
import { createWorld, setInput, snapshotWorld, stepWorld, stopInput } from './simulation.js'
import { pickWorld, project } from './terrain.js'

function run(model, seconds) {
  for (let i = 0; i < Math.ceil(seconds * RULES.fps) && !model.ending; i++) stepWorld(model)
  return model
}
function pour(model, id, seconds, location, strength = 1) { setInput(model,id,location,strength); run(model,seconds); stopInput(model); return model }
function bounded(model) {
  assert.ok(Number.isFinite(model.temperature) && model.temperature >= RULES.minTemperature && model.temperature <= RULES.maxTemperature)
  assert.ok(Number.isFinite(model.seaLevel) && model.seaLevel >= 0 && model.seaLevel <= 75)
  assert.ok(model.particles.length <= RULES.maxParticles && model.vapor.length <= RULES.maxVapor)
  for (const cell of model.cells) for (const key of ['height','moisture','pool','snow','frost','ice','desert','erosion','damage','lava','basalt','heat']) assert.ok(Number.isFinite(cell[key]) && cell[key]>=0,key)
}
test('prolonged rain ends in acute flood; ordinary short doses do not',()=>{
  const model=createWorld();setInput(model,'rain',undefined,1);run(model,150)
  assert.equal(model.ending,'noah');assert.ok(model.time>60);assert.equal(model.input,null);bounded(model)
})
test('soaked coasts continue after release and eventually become Atlantis',()=>{
  const model=pour(createWorld(),'rain',30)
  const emitted=model.rainAdded,erosion=model.metrics.erosion
  run(model,150)
  assert.equal(model.rainAdded,emitted);assert.equal(model.ending,'atlantis');assert.ok(model.metrics.erosion>erosion);bounded(model)
})
test('extreme prolonged cold freezes the ocean; sunshine causes desertification',()=>{
  for(const [id,ending]of [['cold','ice'],['sun','sahara']]){
    const model=createWorld();setInput(model,id,undefined,1);run(model,100)
    assert.equal(model.ending,ending);assert.ok(model.time>60);bounded(model)
  }
})
test('repeated real thermal extremes still trigger 2012, without an accidental ice ending',()=>{
  const model=createWorld()
  for(let phase=0;phase<6&&!model.ending;phase++){
    const id=phase%2?'cold':'sun';setInput(model,id,undefined,1)
    for(let i=0;i<3600&&!model.ending;i++){stepWorld(model);if(id==='sun'?model.temperature>=49:model.temperature<=-13)break}
  }
  stopInput(model);run(model,15)
  assert.equal(model.ending,'apocalypse');assert.ok(model.metrics.damage>.86);bounded(model)
})
test('all seven gentle potions allow free experiments after short use',()=>{
  assert.equal(POTIONS.length,7)
  for(const potion of POTIONS){
    const model=pour(createWorld(),potion.id,6,undefined,RULES.defaultStrength)
    run(model,65)
    assert.equal(model.ending,null,potion.id);bounded(model)
  }
})
test('release stops dose counters and new particles for every potion',()=>{
  for(const p of POTIONS){
    const model=pour(createWorld(),p.id,4)
    const doses={...model.doses},rain=model.rainAdded,snow=model.snowAdded,lava=model.lavaAdded
    run(model,3)
    assert.deepEqual(model.doses,doses,p.id);assert.equal(model.input,null)
    assert.equal(model.rainAdded,rain);assert.equal(model.snowAdded,snow);assert.equal(model.lavaAdded,lava);bounded(model)
  }
})
test('small versus large dose changes actual weather strength',()=>{
  const mild=pour(createWorld(),'wind',6,undefined,RULES.defaultStrength),strong=pour(createWorld(),'wind',6)
  assert.ok(strong.wind>mild.wind*1.8)
  const a=pour(createWorld(),'rain',5,undefined,RULES.defaultStrength),b=pour(createWorld(),'rain',5)
  assert.ok(b.rainAdded>a.rainAdded*1.8);assert.ok(b.seaLevel>a.seaLevel)
})
test('mountain snow builds before an ice age and sun melts it',()=>{
  const model=pour(createWorld(),'cold',8)
  const snow=model.cells.reduce((a,c)=>a+c.snow+c.frost,0)
  assert.ok(snow>0);assert.equal(model.ending,null)
  pour(model,'sun',18)
  assert.ok(model.cells.reduce((a,c)=>a+c.snow+c.frost,0)<snow);assert.ok(model.observed.has('melt'));bounded(model)
})
test('clouds shade sunshine; wind and prior rain create a storm',()=>{
  const clear=pour(createWorld(),'sun',6)
  const cloudy=createWorld();pour(cloudy,'cloud',6);pour(cloudy,'sun',6)
  assert.ok(cloudy.light<clear.light);assert.ok(cloudy.temperature<clear.temperature)
  const storm=createWorld();pour(storm,'rain',6);pour(storm,'wind',8)
  assert.ok(storm.storm>.3);assert.ok(storm.cloudOffset>0);assert.ok(storm.observed.has('storm'));bounded(storm)
})
test('rain followed by sunshine creates a natural rainbow; rainbow potion also works',()=>{
  const model=createWorld();pour(model,'rain',5);pour(model,'sun',6)
  assert.ok(model.rainbow>.05);assert.ok(model.observed.has('rainbow'))
  const magic=pour(createWorld(),'rainbow',4)
  assert.ok(magic.rainbow>.5);assert.ok(magic.observed.has('rainbow'))
})
test('lava flows, reacts with seawater, emits steam and leaves higher basalt terrain',()=>{
  const model=pour(createWorld(),'lava',6,{x:13,y:40})
  assert.ok(model.steamCreated>0);assert.ok(model.basaltCreated>0)
  const basalt=model.basaltCreated,lava=model.cells.reduce((n,c)=>n+c.lava,0)
  run(model,8)
  assert.ok(model.basaltCreated>=basalt);assert.ok(model.cells.some(c=>c.height>c.initial))
  assert.ok(model.cells.reduce((n,c)=>n+c.lava,0)<lava)
  assert.ok(model.observed.has('steam')&&model.observed.has('basalt'));bounded(model)
})
test('endings lock the round and reset creates the same intact island',()=>{
  const model=createWorld();setInput(model,'cold',undefined,1);run(model,100)
  const snapshot=JSON.stringify(snapshotWorld(model)),tick=model.tick
  setInput(model,'rain');stepWorld(model)
  assert.equal(model.tick,tick);assert.equal(JSON.stringify(snapshotWorld(model)),snapshot)
  const reset=createWorld();assert.equal(reset.ending,null);assert.equal(reset.seaLevel,WORLD.seaLevel)
  assert.ok(reset.cells.every(c=>c.height===c.initial&&c.basalt===0));assert.equal(reset.observations.length,0)
})
test('rapid mixed input and invalid time remain bounded',()=>{
  let model=createWorld()
  for(let i=0;i<1800;i++){
    if(model.ending)model=createWorld()
    setInput(model,POTIONS[i%7].id,{x:i%WORLD.size,y:(i*11)%WORLD.size},i%2?1:RULES.defaultStrength)
    stepWorld(model);if(i%60===0)bounded(model)
  }
  const tick=model.tick;stepWorld(model,NaN);stepWorld(model,-1);assert.equal(model.tick,tick)
  stepWorld(model,1000);assert.equal(model.tick,tick+1);bounded(model)
  assert.equal(pickWorld(model,{x:-200,y:-200}),null)
  assert.ok(pickWorld(model,project(26,30,Math.max(model.seaLevel,model.cells[30*WORLD.size+26].height))))
})
