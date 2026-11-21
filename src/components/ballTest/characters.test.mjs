import test from 'node:test'
import assert from 'node:assert/strict'
import { createDecodedImageCache, createCharacterRequestGate } from './decodedImages.js'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b }); return {promise,resolve,reject} }

test('image cache shares pending decodes, retries failures and evicts by count and decoded bytes', async () => {
  let created=0, fail=false
  const cache=createDecodedImageCache({limit:2,maxDecodedBytes:32,createImage:()=>({naturalWidth:2,naturalHeight:2,decode(){ created++; return fail?Promise.reject(Error('network')):Promise.resolve() }})})
  const one=cache.load('one'), duplicate=cache.load('one')
  assert.equal(one,duplicate); await one; assert.equal(created,1)
  await cache.load('two'); await cache.load('one'); await cache.load('three')
  assert.equal(cache.size,2); assert.equal(cache.decodedBytes,32)
  await cache.load('two'); assert.equal(created,4)
  fail=true; await assert.rejects(cache.load('failed')); assert.equal(cache.pendingCount,0)
  fail=false; await cache.load('failed'); assert.equal(cache.size,2)
  const tiny=createDecodedImageCache({maxDecodedBytes:8,createImage:()=>({naturalWidth:2,naturalHeight:2,decode:()=>Promise.resolve()})})
  await tiny.load('oversized'); assert.equal(tiny.size,0); assert.equal(tiny.decodedBytes,0)
})

test('slots commit only a fully decoded pair, ignore stale requests and retain display on failure', async () => {
  const jobs=new Map(), commits=[],errors=[]
  const load=url=>{if(!jobs.has(url)) jobs.set(url,deferred());return jobs.get(url).promise}
  const gate=createCharacterRequestGate(load), old={bodyUrl:'old-body',faceUrl:'old-face'}, next={bodyUrl:'body',faceUrl:'face'}
  const a=gate.request(old,value=>commits.push(value),error=>errors.push(error))
  const b=gate.request(next,value=>commits.push(value),error=>errors.push(error))
  jobs.get('body').resolve(); await Promise.resolve(); assert.deepEqual(commits,[])
  jobs.get('face').resolve(); await b; assert.deepEqual(commits,[next])
  jobs.get('old-body').resolve();jobs.get('old-face').resolve();await a;assert.deepEqual(commits,[next])
  const failed=gate.request({bodyUrl:'bad',faceUrl:'face'},value=>commits.push(value),error=>errors.push(error))
  jobs.get('bad').reject(Error('decode'));await failed;assert.equal(errors.length,1);assert.deepEqual(commits,[next])
  const unmounted=gate.request({bodyUrl:'late',faceUrl:'face'},value=>commits.push(value),error=>errors.push(error));gate.cancel();jobs.get('late').resolve();await unmounted;assert.deepEqual(commits,[next])
})

test('correct sides and all 1000 SVG combinations use manifest placement, optimized faces and matching decorations', async () => {
  const server=await createServer({cacheDir:'/tmp/genesis-ball-render-cache',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'})
  try {
    const {CHARACTERS}=await server.ssrLoadModule('/src/components/ballTest/data.js')
    const {CHARACTER_ASSETS,characterAssetState,characterDecoration}=await server.ssrLoadModule('/src/components/ballTest/characterAssets.js')
    const {CharacterScene}=await server.ssrLoadModule('/src/components/ballTest/CharacterPortrait.jsx')
    assert.equal(CHARACTERS.find(c=>c.id==='tivbo').side,'left')
    assert.equal(CHARACTERS.find(c=>c.id==='lar').side,'right')
    let count=0
    for(const character of CHARACTERS) {
      const spec=CHARACTER_ASSETS[character.id],decoration=characterDecoration(character.id)
      assert.ok(decoration.background.includes(character.id==='lar'?'lar-green':'tivbo-pink'))
      assert.ok(decoration.frame.includes(character.id+'-frame'))
      assert.throws(()=>characterAssetState(character.id,1,spec.face.count+1))
      for(let body=1;body<=8;body++)for(let face=1;face<=spec.face.count;face++) {
        const pair=characterAssetState(character.id,body,face)
        assert.ok(pair.faceUrl.includes('/Art/ball/web/'));assert.ok(pair.bodyUrl.includes(`/Art/ball/${character.id}/body/`))
        const markup=renderToStaticMarkup(createElement(CharacterScene,{character,displayed:pair}))
        assert.ok(markup.includes(`x="${spec.face.bodyPosition.x}" y="${spec.face.bodyPosition.y}" width="${spec.face.width}" height="${spec.face.height}"`))
        assert.equal((markup.match(/filter="url\(/g)||[]).length,2)
        assert.equal((markup.match(/<feGaussianBlur /g)||[]).length,1)
        assert.ok(markup.indexOf('ball-portrait-shadow')<markup.indexOf('ball-portrait-backing'))
        assert.equal((markup.match(/data-layer="face"/g)||[]).length,1)
        assert.ok(markup.indexOf('ball-portrait-frame')>markup.indexOf('data-layer="face"'))
        assert.ok(markup.includes('mask-type:alpha'));assert.ok(!markup.includes('object-fit'))
        assert.ok(markup.includes(`ball-portrait-pattern-${character.id}`))
        count++
      }
    }
    assert.equal(count,1000)
  } finally { await server.close() }
})
