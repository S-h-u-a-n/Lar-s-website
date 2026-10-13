import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { test } from 'node:test'
import { TILE_GEOMETRY, TILE_URLS } from './tileset.js'
import { tileState } from './tileState.js'
import { createWorld } from './simulation.js'

test('all registered PNGs exist, have alpha, the same anchor and transparent corners',()=>{
  assert.equal(Object.keys(TILE_URLS).length,14)
  for(const [id,url]of Object.entries(TILE_URLS)){
    const bytes=readFileSync(new URL(url))
    assert.equal(bytes.subarray(1,4).toString(),'PNG')
    assert.equal(bytes.readUInt32BE(16),64)
    assert.equal(bytes.readUInt32BE(20),id.startsWith('side')?64:32)
    assert.equal(bytes[25],6,'RGBA PNG')
    let at=8,data=[]
    while(at<bytes.length){const size=bytes.readUInt32BE(at),kind=bytes.subarray(at+4,at+8).toString();if(kind==='IDAT')data.push(bytes.subarray(at+8,at+8+size));at+=size+12}
    // PNG exporters may choose any standard row filter, including Paeth.
    const pixels=inflateSync(Buffer.concat(data)), width=bytes.readUInt32BE(16), stride=width*4
    const firstRow=pixels.subarray(1,1+stride), filter=pixels[0]
    assert.ok(filter<=4,'standard PNG filter')
    // With no previous row/left pixel, only Sub/Paeth affect the first RGBA pixel;
    // all predictors are zero, so the corner alpha is readable for every filter.
    assert.equal(firstRow[3],0,'transparent top-left corner')
  }
  assert.equal(TILE_GEOMETRY.top.anchorX,TILE_GEOMETRY.side.anchorX)
  assert.equal(TILE_GEOMETRY.top.anchorY,TILE_GEOMETRY.side.anchorY)
})
test('art selection reflects state and does not mutate the weather or terrain',()=>{
  const world=createWorld(),cell={...world.cells.find(c=>c.height>15&&c.height<25),moisture:.65,desert:0,pool:0}
  const before=JSON.stringify(world)
  assert.equal(tileState(cell,world).base,'grass')
  assert.equal(tileState({...cell,moisture:.1},world).base,'dryGrass')
  assert.equal(tileState({...cell,desert:.9},world).base,'sand')
  assert.equal(tileState({...cell,height:5,ice:1},world).base,'ice')
  assert.equal(tileState({...cell,lava:4},world).base,'lava')
  assert.equal(tileState({...cell,basalt:2},world).base,'basalt')
  assert.ok(tileState({...cell,snow:.5,pool:30},world).snow>0)
  assert.ok(tileState({...cell,snow:.5,pool:30},world).wet>0)
  assert.equal(JSON.stringify(world),before)
})
