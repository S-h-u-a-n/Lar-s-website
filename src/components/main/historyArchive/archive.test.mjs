import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { adjacentRecord, makeStripLayout, maskHit, nearestRecord } from './layout.js'
import { parseHistoryArticle } from './parseArticle.js'
import referenceIds from './wikipediaReferenceIds.json' with { type: 'json' }
import sources from './sources.json' with { type: 'json' }
import { collectReferences } from './references.js'

const placements = JSON.parse(readFileSync(new URL('../../../dev/history/placements.json', import.meta.url))).filter(item=>item.id.startsWith('people-')).sort((a,b)=>Number(a.id.split('-')[1])-Number(b.id.split('-')[1]))
const geometry = JSON.parse(readFileSync(new URL('../../../dev/history/interactionGeometry.json', import.meta.url)))
placements.forEach(item=>{item.origin=geometry[item.id].foot})
const records = JSON.parse(readFileSync(new URL('./records.json', import.meta.url)))
const directory = new URL('../../../../Art/IntroScreen/history/',import.meta.url)
const articleDirectory = new URL('../../../../content/history/',import.meta.url)

test('every existing people PNG has one ordered record and full-resolution source',()=>{
  const files=readdirSync(directory).filter(name=>/^people-\d+\.PNG$/.test(name))
  assert.equal(files.length,18);assert.equal(records.length,files.length)
  assert.deepEqual(records.map(record=>record.id),placements.map(item=>item.id))
  for(const file of files){
    assert.ok(records.some(record=>`${record.id}.PNG`===file))
    const header=readFileSync(new URL(file,directory))
    assert.equal(header.readUInt32BE(16),2109);assert.equal(header.readUInt32BE(20),2984)
  }
})
test('all opaque silhouettes share a visual height and baseline without stretching or changing sequence',()=>{
  for(const scale of [.22,.28,.38]){
    const layout=makeStripLayout(placements,scale)
    for(let i=0;i<layout.items.length;i++){
      const item=layout.items[i],source=placements[i]
      assert.ok(item.x>=0&&item.y>=0&&item.x+item.width<=layout.width&&item.y+item.height<=layout.height)
      assert.ok(Math.abs(item.width/item.height-2109/2984)<1e-9)
      assert.ok(Math.abs((source.bounds[3]-source.bounds[1])/2984*item.height-layout.visibleHeight)<1e-8)
      assert.ok(Math.abs(item.y+source.bounds[3]/2984*item.height-layout.baseline)<1e-8)
      if(i){
        assert.ok(item.x<layout.items[i-1].x)
        const previous=placements[i-1],previousItem=layout.items[i-1]
        const visibleRight=item.x+source.bounds[2]/2109*item.width
        const previousLeft=previousItem.x+previous.bounds[0]/2109*previousItem.width
        assert.ok(Math.abs(previousLeft-visibleRight-layout.gap)<1e-8)
        assert.ok(layout.gap>=74)
      }
    }
    assert.equal(nearestRecord(layout.items,layout.items[7].x+layout.items[7].width/2),7)
  }
})
test('left and right neighbors follow actual horizontal positions, including visual edges',()=>{
  const items=[{x:200,width:20},{x:0,width:20},{x:100,width:20}]
  assert.equal(adjacentRecord(items,2,'left'),1)
  assert.equal(adjacentRecord(items,2,'right'),0)
  assert.equal(adjacentRecord(items,1,'left'),null)
  assert.equal(adjacentRecord(items,0,'right'),null)
  assert.equal(adjacentRecord(items,-1,'left'),null)

  const layout=makeStripLayout(placements)
  assert.equal(adjacentRecord(layout.items,8,'left'),9)
  assert.equal(adjacentRecord(layout.items,8,'right'),7)
  assert.equal(adjacentRecord(layout.items,placements.length-1,'left'),null)
  assert.equal(adjacentRecord(layout.items,0,'right'),null)
})
test('all 18 ordered Markdown articles provide complete display data and retained illustration notes',()=>{
  const files=readdirSync(articleDirectory).filter(name=>name.endsWith('.md')).sort()
  assert.equal(files.length,18)
  assert.equal(records.length,files.length)
  files.forEach((file,index)=>{
    assert.match(file,new RegExp(`^${String(index+1).padStart(2,'0')}-[a-z0-9-]+\\.md$`))
    assert.equal(records[index].id,`people-${index+1}`)
    const raw=readFileSync(new URL(file,articleDirectory),'utf8')
    const blocks=raw.trim().split(/\r?\n[ \t]*\r?\n/).map(block=>block.trim()).filter(Boolean)
    const referenceIndex=blocks.findIndex((block,blockIndex)=>blockIndex>=5&&/^(參考資料|資料參考|參考網址)/.test(block.split('\n',1)[0].trim()))
    const article=parseHistoryArticle(raw,file)
    assert.ok(article.name && article.region && article.date)
    assert.ok(article.introduction.length)
    assert.doesNotMatch(article.name,/^\d+\./)
    assert.deepEqual([article.name,article.region,article.date],[blocks[1],blocks[2],blocks[3]])
    assert.deepEqual([
      ...article.introduction,
      ...article.sections.flatMap(section=>[section.title,...section.paragraphs]),
    ],blocks.slice(4,referenceIndex))
    assert.deepEqual(article.references,blocks.slice(referenceIndex))
    assert.ok(article.sections.length >= 3)
    assert.equal(new Set(article.sections.map(section=>section.title)).size,article.sections.length)
    assert.ok(article.sections.every(section=>section.paragraphs.length && section.paragraphs.every(text=>text.length)))
    assert.ok(article.references.length)
    assert.ok(article.references.some(block=>/https?:\/\//.test(block)))
    const wikiReferences=collectReferences({sources:referenceIds[records[index].id]},sources)
    assert.ok(wikiReferences.length)
    assert.ok(wikiReferences.every(source=>source.label && new URL(source.href).hostname.endsWith('wikipedia.org')))
    assert.deepEqual(Object.keys(records[index]).sort(),['id',...(records[index].illustrationNote?['illustrationNote']:[])].sort())
  })
  assert.deepEqual(Object.keys(referenceIds).sort(),records.map(record=>record.id).sort())
})
test('transparent padding cannot select a person; opaque pixels do at different sizes',()=>{
  const geometry={maskWidth:2,maskHeight:2},bits=Uint8Array.of(0b01000000)
  assert.equal(maskHit(geometry,bits,10,10,100,100),false)
  assert.equal(maskHit(geometry,bits,75,25,100,100),true)
  assert.equal(maskHit(geometry,bits,150,50,200,200),true)
  assert.equal(maskHit(geometry,bits,-1,10,100,100),false)
  assert.equal(maskHit(geometry,bits,100,10,100,100),false)
})
