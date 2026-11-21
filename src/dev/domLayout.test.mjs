import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { layoutItem, layoutOverrides, layoutStyles, localSize } from './domLayout.js'

const baseline = { id:'image',x:0,y:0,width:84,height:84,rotation:0,zIndex:0 }

test('unmodified exported snapshots never convert percentage images to fixed pixels', () => {
  const snapshot = {...baseline,width:100,height:100,changedFields:[]}
  assert.deepEqual(layoutOverrides(snapshot),{})
  assert.deepEqual(layoutStyles(layoutItem(baseline,snapshot)),{})
})

test('authored fields remain applied through measurements of their own DOM writes', () => {
  const published = {...baseline,width:100,height:100,changedFields:['width']}
  const first = layoutItem(baseline,published)
  const afterResize = layoutItem({...baseline,width:100},published)
  assert.deepEqual(layoutStyles(first),{width:'100px'})
  assert.deepEqual(layoutStyles(afterResize),{width:'100px'})
  assert.equal(first.height,84)
  assert.deepEqual(layoutStyles(layoutItem(baseline,published,{width:120})),{width:'120px'})
})

test('removing an override records the change even when the measured number is identical', () => {
  const authored = layoutItem(baseline,{width:100,changedFields:['width']})
  const cleared = layoutItem({...baseline,width:100},null)
  assert.equal(authored.width,cleared.width)
  assert.notDeepEqual(authored,cleared)
  assert.deepEqual(layoutStyles(cleared),{})
})

test('legacy sparse local drafts and partial position edits are preserved', () => {
  assert.deepEqual(layoutStyles(layoutItem(baseline,null,{width:96,height:80,x:12,rotation:4,zIndex:8})),{translate:'12px 0px',rotate:'4deg',width:'96px',height:'80px',zIndex:8})
  assert.deepEqual(layoutOverrides({width:NaN,height:undefined,x:Infinity}),{})
})

test('hidden percentage dimensions are not parsed as pixel measurements', () => {
  const hidden = {offsetWidth:0,offsetHeight:0,getBoundingClientRect:()=>({width:0,height:0})}
  assert.equal(localSize(hidden,'width',{width:'100%'}),0)
  const visible = {...hidden,offsetWidth:84,offsetHeight:84}
  assert.equal(localSize(visible,'width',{width:'100%'}),84)
  assert.equal(localSize(visible,'height',{height:'84px'}),84)
  assert.equal(localSize(visible,'width',{width:'83.5px'}),83.5)
})

test('published Globe layout keeps authored notebook width and no per-message avatar snapshots', () => {
  const source = readFileSync(new URL('../components/globeTest/config.js',import.meta.url),'utf8')
  const records = JSON.parse(source.slice(source.indexOf('[\n')))
  assert.equal(records.filter(record=>record.selector.includes('.gt-avatar')).length,0)
  const authored = records.filter(record=>Object.keys(layoutOverrides(record)).length)
  assert.equal(authored.length,1)
  assert.equal(authored[0].selector.includes('.gt-notes'),true)
  assert.deepEqual(layoutOverrides(authored[0]),{width:632.69})
})
