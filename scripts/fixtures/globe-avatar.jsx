// Development regression fixture: actual dialogue, editor adapter and profile card.
// No draft writes, model rendering or changes to the dialogue/character datasets.
import React, { StrictMode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal, flushSync } from 'react-dom'
import StoryDialog from '../../src/components/globeTest/StoryDialog'
import DomPageAdapter from '../../src/dev/DomPageAdapter'
import CharacterFile from '../../src/dev/characters/CharacterFile'
import { charactersWithProfiles } from '../../src/dev/characters/characters'
import { GLOBE_LAYOUT_REVISION } from '../../src/components/globeTest/config'
import { ALL_CHAPTERS, CHARACTERS, PALETTE } from '../../src/components/globeTest/data'
import '../../src/styles.css'
import '../../src/edition/edition.css'
import '../../src/edition/round2.css'
import '../../src/components/globeTest/GlobeTest.css'
import '../../src/dev/characters/characters.css'

const chapters = ALL_CHAPTERS.filter(chapter => chapter.dialogue.length)
const frame = () => new Promise(resolve => requestAnimationFrame(resolve))
// Adapter's optional storage seam keeps legacy-draft scenarios in memory.
const drafts = new Map()
const storage = { getItem:key => drafts.get(key) ?? null, setItem() { throw new Error('Regression fixture must not write layout drafts') } }
const metrics = { samples:0, mismatches:0, unloaded:0, transitions:0, sizes:new Set(), roles:new Set(), examples:[] }
window.avatarRegression = metrics // Read-only diagnostic result for manual inspection.
function sample() {
  for (const row of document.querySelectorAll('.gt-chat-log > div:not([hidden]) > .gt-dialogue:not([hidden])')) {
    const avatar = row.querySelector('.gt-avatar'), img = avatar.querySelector('img')
    const a = getComputedStyle(avatar), i = img && getComputedStyle(img)
    const result = { role:row.querySelector('h3').textContent, wrapper:[a.width,a.height], image:i && [i.width,i.height], inline:img?.getAttribute('style'), loaded:img?.complete, natural:img && [img.naturalWidth,img.naturalHeight], fit:i?.objectFit, tag:avatar.tagName, shrink:a.flexShrink, padding:a.padding }
    metrics.samples++; metrics.roles.add(result.role)
    if (img && !img.complete) metrics.unloaded++
    metrics.sizes.add(`${result.wrapper.join('×')} / ${result.image?.join('×')}`)
    if (a.width !== '84px' || a.height !== '84px' || a.padding !== '0px' || (i && (i.width !== '84px' || i.height !== '84px' || i.objectFit !== 'contain'))) {
      metrics.mismatches++
      if (metrics.examples.length < 8) metrics.examples.push(result)
    }
  }
}
function snapshot() { return JSON.stringify({...metrics,sizes:[...metrics.sizes],roles:[...metrics.roles]},null,2) }

function Lab() {
  const [chapterId,setChapterId] = useState(chapters[0].id), [line,setLine] = useState(0), [profile,setProfile] = useState(null)
  const [editor,setEditor] = useState(true), [report,setReport] = useState('Sampling initial load…'), [running,setRunning] = useState(false), [generation,setGeneration] = useState(0)
  const reportRef = useRef(null)
  const [host,setHost] = useState(null)
  useEffect(()=>setHost(document.querySelector('.gt-story-dialog')),[])
  const chapter = chapters.find(chapter => chapter.id===chapterId)
  useLayoutEffect(sample, [chapterId,line,profile,editor,generation])
  useEffect(() => {
    const observe = new MutationObserver(records => { metrics.transitions += records.filter(record=>record.target.closest('.gt-avatar')).length })
    observe.observe(document.querySelector('.gt-page'), {subtree:true,attributes:true,attributeFilter:['style']})
    let raf, count=0
    const tick = () => { sample(); if (++count<120) raf=requestAnimationFrame(tick); else setReport(snapshot()) }
    raf=requestAnimationFrame(tick)
    const resize = () => { sample(); setReport(snapshot()) }
    window.addEventListener('resize',resize)
    return () => { cancelAnimationFrame(raf); observe.disconnect(); window.removeEventListener('resize',resize) }
  }, [generation])
  const change = (id,index=0) => flushSync(() => { setChapterId(id); setLine(index) })
  const run = async ({cold=false}={}) => {
    setRunning(true)
    metrics.samples=metrics.mismatches=metrics.unloaded=metrics.transitions=0
    metrics.sizes.clear(); metrics.roles.clear(); metrics.examples=[]
    if (cold) reloadImages()
    // Every speaking character, transitions between all playable chapters and
    // first / middle / final messages. DOM load/decode and editor RAFs can race.
    for (const current of chapters) {
      for (const index of [...new Set([0,1,Math.floor(current.dialogue.length/2),current.dialogue.length-1])].filter(i=>i<current.dialogue.length)) {
        change(current.id,index)
        sample(); await frame(); sample(); await frame(); sample()
      }
    }
    const person=charactersWithProfiles.find(person=>Object.values(CHARACTERS).some(character=>character.name===person.name))
    flushSync(()=>setProfile(person.id)); await frame(); sample(); await frame()
    flushSync(()=>setProfile(null)); await frame(); sample()
    for (let n=0;n<30;n++) { await frame(); sample() }
    setReport(snapshot()); setRunning(false); reportRef.current?.focus()
  }
  const reloadImages = () => {
    // Real original JPEGs, new URL queries only; production role data is untouched.
    const stamp=Date.now()
    for (const image of document.querySelectorAll('.gt-avatar img')) {
      image.src = `${image.src.split('?')[0]}?avatar-regression=${stamp}`
    }
    sample()
    setGeneration(value=>value+1)
  }
  const replayLegacy = () => {
    const avatar=document.querySelector('.gt-chat-log > div:not([hidden]) .gt-avatar')
    const records=[avatar,avatar.querySelector('img')].filter(Boolean).map(element=>{
      const path=[]
      for(let node=element;node;node=node.parentElement) {
        const cls=[...node.classList].find(name=>!name.startsWith('is-')&&!name.startsWith('has-'))
        const siblings=[...node.parentElement.children].filter(item=>item.localName===node.localName)
        path.unshift(`${node.localName}${cls?'.'+CSS.escape(cls):''}:nth-of-type(${siblings.indexOf(node)+1})`)
        if(node.matches('.gt-page'))break
      }
      const selector=path.join(' > ')
      let hash=2166136261;for(const char of selector)hash=Math.imul(hash^char.charCodeAt(0),16777619)
      return {id:`globe-test-${element.localName}-${(hash>>>0).toString(36)}`,selector,width:210,height:42,rotation:7}
    })
    drafts.set('layout-editor:codex-globe-test:dom-v1',JSON.stringify(records))
    drafts.set('layout-editor:codex-globe-test:dom-v1:defaults-revision',GLOBE_LAYOUT_REVISION)
    metrics.legacyDrafts=records.length
    setGeneration(value=>value+1)
  }
  return <>
    <main className="gt-page" style={{...Object.fromEntries(Object.entries(PALETTE).map(([key,value])=>[`--gt-${key}`,value])),'--gt-story-duration':'420ms','--gt-easing':'cubic-bezier(.22,.75,.25,1)'}}>
      <div className="gt-decor"/>
      <StoryDialog chapterId={chapterId} line={line} onNext={()=>setLine(value=>Math.min(value+1,chapter.dialogue.length-1))} onClose={()=>setChapterId(null)} onOpenCharacter={setProfile}/>
      {profile && <CharacterFile character={charactersWithProfiles.find(person=>person.id===profile)} characters={charactersWithProfiles} onSelect={setProfile} onClose={()=>setProfile(null)}/>}
    </main>
    {editor && <DomPageAdapter key={generation} pageId="globe-test" storage={storage}/>}
    {host && createPortal(<aside style={{position:'fixed',zIndex:20000,right:8,bottom:8,width:285,maxHeight:'45vh',overflow:'auto',background:'#fffef8',border:'1px solid #34465a55',padding:12,font:'12px/1.5 monospace'}}>
      <strong>Avatar regression lab</strong>
      <p>Actual StoryDialog + DomPageAdapter. Expected: wrapper and contained image 84 × 84 CSS px.</p>
      <button disabled={running} onClick={()=>run()}>Run transition / profile stress</button>{' '}
      <button onClick={()=>setEditor(value=>!value)}>Editor: {editor?'on':'off'}</button>{' '}
      <button disabled={running} onClick={()=>run({cold:true})}>Cold images + stress</button>{' '}
      <button onClick={replayLegacy}>Replay legacy avatar drafts</button>{' '}
      <button onClick={reloadImages}>Reload image URLs</button>{' '}
      <button onClick={()=>{sample();setReport(snapshot())}}>Sample now</button>
      <select aria-label="Test chapter" value={chapterId??''} onChange={event=>change(event.target.value)}>{chapters.map(chapter=><option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}</select>
      <pre ref={reportRef} tabIndex={-1} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',font:'inherit'}}>{report}</pre>
    </aside>,host)}
  </>
}
createRoot(document.getElementById('root')).render(<StrictMode><Lab/></StrictMode>)
