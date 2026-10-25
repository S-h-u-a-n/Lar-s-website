import assert from 'node:assert/strict'
import { test } from 'node:test'
import { paintStroke, strokePoints } from './brush.js'
import { BRUSH_SIZES, MATERIAL as M, POTIONS, RULES } from './config.js'
import { brushSettings } from './brushSettings.js'
import { createWorld, setInput, stepWorld, stopInput } from './simulation.js'

test('fast strokes cover the entire path with overlapping dabs', () => {
  const from={x:5,y:30},to={x:202,y:50},points=strokePoints(from,to)
  let last=from
  for(const point of points){assert.ok(Math.hypot(point.x-last.x,point.y-last.y)<=RULES.brushSpacing+1e-6);last=point}
  assert.deepEqual(last,to)
  const w=createWorld();paintStroke(w,'rain',from,to,1,true)
  for(let x=5;x<=202;x++)assert.ok(Array.from({length:50},(_,dy)=>w.material[(10+dy)*w.columns+x]).includes(M.WATER),`gap at ${x}`)
})
test('a single click immediately emits actual rain, snow, lava and cloud cells', () => {
  for(const [type,kind]of [['rain',M.WATER],['cold',M.SNOW],['lava',M.LAVA],['cloud',M.CLOUD]]){
    const w=createWorld(),before=w.counts[kind]
    assert.ok(paintStroke(w,type,null,{x:100,y:30},1,true)>0,type)
    assert.ok(w.counts[kind]>before,type)
    assert.equal(w.input,null)
  }
})
test('stationary brush emits continuously and release stops all injection', () => {
  for(const type of ['rain','cold','lava','cloud']){
    const w=createWorld();setInput(w,type,{x:160,y:35,mode:'brush'},1)
    for(let i=0;i<30;i++)stepWorld(w)
    assert.ok(w.injected>50,type)
    stopInput(w);const injected=w.injected,doses={...w.doses}
    for(let i=0;i<60;i++)stepWorld(w)
    assert.equal(w.injected,injected);assert.deepEqual(w.doses,doses)
  }
})
test('brush never replaces terrain and water-family injection is accounted for', () => {
  const w=createWorld(),before=w.material.slice(),mass=[M.WATER,M.SNOW,M.ICE,M.STEAM,M.CLOUD].reduce((n,k)=>n+w.counts[k],0)
  paintStroke(w,'rain',{x:20,y:150},{x:200,y:150},1,true)
  before.forEach((kind,i)=>{if(kind===M.ROCK||kind===M.SOIL)assert.equal(w.material[i],kind)})
  assert.equal([M.WATER,M.SNOW,M.ICE,M.STEAM,M.CLOUD].reduce((n,k)=>n+w.counts[k],0),mass+w.rainAdded)
})
test('sun, cold, wind and rainbow clicks have distinct effects, sunshine preserves lava heat', () => {
  const w=createWorld(),point={x:100,y:30},i=point.y*w.columns+point.x
  paintStroke(w,'lava',null,point,1,true);assert.equal(w.material[i],M.LAVA)
  paintStroke(w,'sun',null,point,1,true);assert.equal(w.temperatureGrid[i],520);assert.ok(w.temperature>18&&w.light>57)
  paintStroke(w,'cold',null,point,1,true);assert.ok(w.temperatureGrid[i]<520)
  paintStroke(w,'wind',null,point,1,true);assert.ok(w.wind>0)
  paintStroke(w,'rainbow',null,point,1,true);assert.ok(w.rainbow>0)
})
test('full grid, invalid input and ended rounds remain bounded', () => {
  const w=createWorld();w.material.fill(M.ROCK);w.counts.fill(0);w.counts[M.ROCK]=w.material.length
  assert.equal(paintStroke(w,'rain',null,{x:100,y:30},1,true),0)
  assert.equal(paintStroke(w,'rain',null,{x:NaN,y:30},1,true),0)
  w.ending='noah';const revision=w.paintRevision;paintStroke(w,'sun',null,{x:100,y:30},1,true);assert.equal(w.paintRevision,revision)
})

test('all seven sizes change radius and effective strength; material flow follows footprint area', () => {
  assert.equal(RULES.defaultBrush,'medium')
  for(const potion of POTIONS){
    const [small,medium,large]=BRUSH_SIZES.map(s=>brushSettings(potion.id,.45,s.id))
    assert.ok(small.radius<medium.radius&&medium.radius<large.radius,potion.id)
    assert.ok(small.power<medium.power&&medium.power<large.power,potion.id)
    assert.ok(small.radius<3 && medium.radius<6,potion.id)
    if(medium.flow){
      assert.ok(small.flow<medium.flow&&medium.flow<large.flow,potion.id)
      assert.ok(Math.abs(large.flow/medium.flow-(large.radius/medium.radius)**2)<1e-9)
    }
  }
})
test('small, medium and large produce distinct real deposits at the same dose and time', () => {
  for(const type of ['rain','cold','cloud','lava']){
    const counts=BRUSH_SIZES.map(size=>{
      const w=createWorld();setInput(w,type,{x:150,y:30,mode:'brush',brushSize:size.id},.45)
      for(let i=0;i<60;i++)stepWorld(w)
      stopInput(w);const before=w.injected
      for(let i=0;i<30;i++)stepWorld(w)
      assert.equal(w.injected,before,type)
      assert.equal([...w.counts].reduce((a,b)=>a+b),w.material.length)
      return before
    })
    assert.ok(counts[0]<counts[1]&&counts[1]<counts[2],`${type}: ${counts}`)
    const oldRate={rain:RULES.rainRate,cold:RULES.snowRate,cloud:RULES.cloudRate,lava:RULES.lavaRate}[type]*.45
    assert.ok(counts[1]<oldRate*2*.4,`${type} medium must be substantially gentler`)
  }
})
test('every size leaves connected fast strokes and medium avoids the old overlapping-dab flood', () => {
  const totals=[]
  for(const size of BRUSH_SIZES){
    const w=createWorld();paintStroke(w,'rain',{x:10,y:35},{x:200,y:35},.45,true,size.id)
    for(let x=10;x<=200;x++)assert.ok(Array.from({length:24},(_,dy)=>w.material[(23+dy)*w.columns+x]).includes(M.WATER),`${size.id} gap ${x}`)
    totals.push(w.rainAdded)
  }
  assert.ok(totals[0]<totals[1]&&totals[1]<totals[2],`${totals}`)
  assert.ok(totals[1]<700,`${totals[1]} compared with old >1300 deposits`)
})
test('high-frequency stationary pointer events cannot stack an unlimited column in one step', () => {
  const w=createWorld(),point={x:150,y:30}
  for(let i=0;i<1000;i++)paintStroke(w,'rain',point,point,.45,false,'medium')
  const radius=brushSettings('rain',.45,'medium').radius
  assert.ok(w.rainAdded<=(Math.ceil(radius)*2+1)**2)
  const before=w.rainAdded;stepWorld(w);paintStroke(w,'rain',null,point,.45,true,'medium')
  assert.ok(w.rainAdded>before)
})
test('local heat/cold footprint and wind/rainbow input vary with size without replacing materials', () => {
  for(const type of ['sun','cold','wind','rainbow']){
    const effects=BRUSH_SIZES.map(size=>{
      const w=createWorld(),before=w.temperatureGrid.slice()
      paintStroke(w,type,null,{x:150,y:30},.45,true,size.id)
      if(type==='wind')return w.wind
      if(type==='rainbow')return w.rainbow
      return w.temperatureGrid.reduce((n,t,i)=>n+(t!==before[i]?1:0),0)
    })
    assert.ok(effects[0]<effects[1]&&effects[1]<effects[2],`${type}: ${effects}`)
  }
})
