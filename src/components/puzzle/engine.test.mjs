import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createPuzzle,moveGroup,snapGroup,isSolved,restore,piecePath} from './engine.js'
import {saveProgress,loadProgress,unlocked,keyFor,lastDifficulty,selectedAvatarCover,setAvatarCover} from './progress.js'
const art={id:'test-main',version:1,width:8994,height:4048,difficulties:[24,48,96]}
function solve(m){m.positions=m.pieces.map(p=>({x:130+p.x,y:90+p.y,group:p.id}));snapGroup(m,0)}
test('original panoramic aspect and shared contours are preserved at every difficulty',()=>{for(const n of art.difficulties){const m=createPuzzle(art.width,art.height,n);assert.ok(Math.abs(m.w/m.h-art.width/art.height)<1e-12);for(const p of m.pieces){assert.ok(piecePath(p).endsWith('Z'));if(p.c<m.cols-1)assert.equal(p.edges[1],-m.pieces[p.id+1].edges[3]);if(p.r<m.rows-1)assert.equal(p.edges[2],-m.pieces[p.id+m.cols].edges[0]);}}})
test('neighbors join away from guide; joined pieces move as a group',()=>{const m=createPuzzle(8994,4048);const a=m.positions[0],b=m.positions[1];a.x=100;a.y=100;b.x=100+m.cw+4;b.y=103;assert.ok(snapGroup(m,0)>0);assert.equal(m.positions[0].group,m.positions[1].group);const x=b.x;moveGroup(m,0,20,30);assert.equal(b.x,x+20);assert.equal(m.positions[0].y,133)})
test('nearby non-neighbors cannot join',()=>{const m=createPuzzle(8994,4048);m.positions.forEach((p,i)=>{p.x=1000+i*100;p.y=900});m.positions[0]={x:0,y:0,group:0};m.positions[2]={x:m.cw,y:0,group:2};assert.equal(snapGroup(m,0),0)})
test('transitive joining completes and valid groups survive reload; corrupt data rejected',()=>{const m=createPuzzle(8994,4048);solve(m);assert.equal(isSolved(m),true);const saved=JSON.parse(JSON.stringify(m));const next=createPuzzle(8994,4048);assert.equal(restore(next,saved),true);assert.equal(isSolved(next),true);saved.positions[2].x+=10;assert.equal(restore(createPuzzle(8994,4048),saved),false);assert.equal(restore(next,{...m,positions:[]}),false)})
test('progress is isolated by artwork, version and difficulty; restart retains unlock',()=>{const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};globalThis.window={dispatchEvent(){}};const m=createPuzzle(8994,4048,48);moveGroup(m,0,17,-5);saveProgress(art,48,m);assert.deepEqual(loadProgress(art,48).positions,m.positions);assert.equal(lastDifficulty(art),48);assert.notEqual(keyFor(art,48),keyFor({...art,version:2},48));assert.equal(unlocked(art),false);solve(m);saveProgress(art,48,m);assert.equal(unlocked(art),true);saveProgress(art,48,createPuzzle(8994,4048,48));assert.equal(unlocked(art),true);assert.equal(unlocked({...art,id:'other'}),false)})

import {settleGroup,isLocked,snapRadius,scatterLoose,bringToFront} from './engine.js'
test('a single piece and a free group anchor exactly and cannot drag the anchor through another snap',()=>{
  const m=createPuzzle(8994,4048),p=m.pieces[0];m.positions[0]={x:5,y:3,group:0,locked:false}
  const result=settleGroup(m,0,10);assert.equal(result.locked,true);assert.equal(m.positions[0].x,0);assert.equal(m.positions[0].y,0)
  m.positions[1]={x:m.cw+4,y:2,group:1,locked:false};settleGroup(m,1,10);assert.equal(isLocked(m,1),true);assert.equal(m.positions[0].x,0);assert.equal(m.positions[1].x,m.cw)
  assert.equal(settleGroup(m,0,100).ids.length,0)
})
test('a joined group anchors as a rigid body; far-away pieces never snap',()=>{
  const m=createPuzzle(8994,4048);m.positions[0]={x:5,y:4,group:0,locked:false};m.positions[1]={x:m.cw+5,y:4,group:0,locked:false}
  settleGroup(m,1,10);assert.equal(m.positions[0].locked,true);assert.equal(m.positions[1].locked,true)
  const other=createPuzzle(8994,4048);other.positions[0]={x:40,y:40,group:0,locked:false};assert.equal(settleGroup(other,0,10).ids.length,0)
})
test('screen-space snapping stays consistent at different zoom levels and is capped by piece size',()=>{
  const m=createPuzzle(8994,4048,96)
  for(const scale of [.3,1,2])assert.ok(snapRadius(m,scale)*scale<=11+.0001)
  assert.equal(snapRadius(m,1)*1,snapRadius(m,2)*2)
  assert.ok(snapRadius(m,.1)*.1<=Math.min(m.cw,m.ch)*.1*.25)
})
test('v1 storage coordinates migrate without losing group offsets; z-order and locks survive v2 saves',()=>{
  const m=createPuzzle(8994,4048);m.positions[0]={x:30,y:60,group:0};m.positions[1]={x:30+m.cw,y:60,group:0}
  const legacy={version:1,cols:m.cols,rows:m.rows,positions:m.positions.map(p=>({...p,x:p.x+300,y:p.y+120}))}
  const restored=createPuzzle(8994,4048);assert.equal(restore(restored,legacy),true);assert.equal(restored.positions[0].x,30);assert.equal(restored.positions[1].group,0)
  restored.positions[0].x=0;restored.positions[0].y=0;restored.positions[1].x=m.cw;restored.positions[1].y=0;settleGroup(restored,0,1);bringToFront(restored,0)
  const next=createPuzzle(8994,4048);assert.equal(restore(next,JSON.parse(JSON.stringify(restored))),true);assert.equal(next.positions[0].locked,true);assert.deepEqual(next.order,restored.order)
  next.positions[0].x=5;assert.equal(restore(createPuzzle(8994,4048),JSON.parse(JSON.stringify(next))),false)
})
test('organizing leaves assembled and locked groups untouched; overlap does not lose any pieces',()=>{
  const m=createPuzzle(8994,4048);m.positions[1].group=0;m.positions[2].locked=true;const before=JSON.stringify(m.positions.slice(0,3));scatterLoose(m,{width:1200,height:650});assert.equal(JSON.stringify(m.positions.slice(0,3)),before);assert.equal(new Set(m.order).size,m.pieces.length)
})
test('expanded pieces use bounded left and right trays at every difficulty and image ratio',()=>{
  for(const [width,height] of [[2048,2048],[8994,4048],[12524,2620]])for(const target of [24,96,180]){
    const m=createPuzzle(width,height,target),view={width:1200,height:650}
    scatterLoose(m,view)
    const free=m.pieces.filter(p=>!m.positions[p.id].locked&&m.positions[p.id].group===p.id)
    const left=free.filter(p=>m.positions[p.id].x<0),right=free.filter(p=>m.positions[p.id].x>=m.w)
    assert.ok(left.length>0&&right.length>0,`${width}x${height} target ${target} should use both sides`)
    assert.ok(Math.abs(left.length-right.length)<=1,`${width}x${height} target ${target} should balance both sides`)
    const ys=free.map(p=>m.positions[p.id].y)
    assert.ok(Math.max(...ys)-Math.min(...ys)<=m.h*1.5,`${width}x${height} target ${target} should stay within a bounded vertical area`)
    for(const p of free)assert.ok(Number.isFinite(m.positions[p.id].x)&&Number.isFinite(m.positions[p.id].y))
  }
})
test('rearranging moves only loose singles and preserves all assembled group offsets',()=>{
  const m=createPuzzle(12524,2620,180)
  m.positions[0].group=m.positions[1].group=0
  m.positions[2].locked=true
  m.positions[3].x=240;m.positions[3].y=180
  const assembled=m.positions.slice(0,2).map(p=>({...p})),locked={...m.positions[2]},count=scatterLoose(m,{width:390,height:700})
  assert.equal(count,m.pieces.length-3)
  assert.deepEqual(m.positions.slice(0,2),assembled)
  assert.deepEqual(m.positions[2],locked)
  const prior=m.positions.slice(3).map(p=>({...p}))
  scatterLoose(m,{width:390,height:700})
  assert.ok(m.positions.slice(3).some((p,i)=>p.x!==prior[i].x||p.y!==prior[i].y))
  assert.equal(new Set(m.order).size,m.pieces.length)
})
test('portrait, square, and landscape artworks keep their proportions and receive balanced grids',()=>{
  for(const [width,height] of [[1800,3600],[2400,2400],[8994,4048]])for(const target of [24,96,180]){
    const model=createPuzzle(width,height,target),actual=model.pieces.length
    assert.ok(Math.abs(model.w/model.h-width/height)<1e-12)
    assert.ok(Math.abs(actual-target)/target<=.15,`${width}x${height} target ${target} produced ${actual} pieces`)
    assert.ok(Math.abs(Math.log((model.cols/model.rows)/(width/height)))<.35,`${width}x${height} grid ${model.cols}x${model.rows}`)
  }
})
test('artwork progress, difficulty preference, and unlock remain independent',()=>{
  const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};globalThis.window={dispatchEvent(){}}
  const first={id:'portrait-work',version:1,width:1800,height:3600,difficulties:[24,96]}
  const second={id:'square-work',version:1,width:2400,height:2400,difficulties:[24,96]}
  const firstModel=createPuzzle(first.width,first.height,24),secondModel=createPuzzle(second.width,second.height,24)
  moveGroup(firstModel,0,31,-12);moveGroup(secondModel,0,-18,27)
  assert.equal(saveProgress(first,24,firstModel),true);assert.equal(saveProgress(second,24,secondModel),true)
  assert.deepEqual(loadProgress(first,24).positions,firstModel.positions)
  assert.deepEqual(loadProgress(second,24).positions,secondModel.positions)
  assert.equal(unlocked(first),false);assert.equal(unlocked(second),false)
  solve(firstModel);assert.equal(saveProgress(first,24,firstModel),true)
  assert.equal(unlocked(first),true);assert.equal(unlocked(second),false)
  assert.deepEqual(loadProgress(second,24).positions,secondModel.positions)
})

test('three-part collection unlocks only after all parts; replay and difficulty saves retain completion',()=>{
  const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};globalThis.window={dispatchEvent(){}}
  const items=[4071,4557,3969].map((width,i)=>({id:`long-${i+1}`,version:1,width,height:2620,difficulties:[24,96,180]}))
  const collection={id:'long',items}
  assert.equal(unlocked(collection),false)
  items.forEach((part,i)=>{
    const m=createPuzzle(part.width,part.height,part.difficulties[i]);solve(m);saveProgress(part,part.difficulties[i],m)
    assert.equal(unlocked(collection),i===2)
  })
  saveProgress(items[0],24,createPuzzle(items[0].width,items[0].height,24))
  assert.equal(unlocked(collection),true)
  assert.equal(loadProgress(items[1],96).hasSaved,true)
  assert.ok(!loadProgress(items[1],24).hasSaved)
  assert.equal([...data.keys()].some(key=>key.includes(':long:')),false)
})

test('avatar collection reveals each portrait after any difficulty is completed and keeps it unlocked after reload',()=>{
  const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};globalThis.window={dispatchEvent(){}}
  const avatars=[{id:'avatar-one',version:1,width:2048,height:2048,difficulties:[24,96]},{id:'avatar-two',version:1,width:2048,height:2048,difficulties:[24,96]}]
  const collection={id:'avatars',items:avatars}
  assert.equal(avatars.filter(unlocked).length,0)
  const first=createPuzzle(avatars[0].width,avatars[0].height,96);solve(first);saveProgress(avatars[0],96,first)
  assert.equal(avatars.filter(unlocked).length,1)
  assert.equal(unlocked(avatars[0]),true)
  assert.equal(unlocked(avatars[1]),false)
  const second=createPuzzle(avatars[1].width,avatars[1].height,24);solve(second);saveProgress(avatars[1],24,second)
  assert.equal(avatars.filter(unlocked).length,2)
  assert.equal(unlocked(collection),true)
})

test('only completed avatars can be selected as the persistent collection cover',()=>{
  const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};globalThis.window={dispatchEvent(){}}
  const avatars=[{id:'cover-one',version:1,width:2048,height:2048,difficulties:[24,96]},{id:'cover-two',version:1,width:2048,height:2048,difficulties:[24,96]}]
  assert.equal(selectedAvatarCover(avatars),null)
  assert.equal(setAvatarCover(avatars,avatars[0]),false)
  const first=createPuzzle(avatars[0].width,avatars[0].height,96);solve(first);saveProgress(avatars[0],96,first)
  assert.equal(setAvatarCover(avatars,avatars[0]),true)
  assert.equal(selectedAvatarCover(avatars)?.id,'cover-one')
  const second=createPuzzle(avatars[1].width,avatars[1].height,24);solve(second);saveProgress(avatars[1],24,second)
  assert.equal(setAvatarCover(avatars,avatars[1]),true)
  assert.equal(selectedAvatarCover(avatars)?.id,'cover-two')
  assert.equal(setAvatarCover(avatars,{...avatars[0]}),false)
  assert.equal(selectedAvatarCover(avatars)?.id,'cover-two')
})
