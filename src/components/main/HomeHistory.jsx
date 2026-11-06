import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HISTORY_RECORDS } from './historyArchive/data'
import { makeStripLayout, maskHit, nearestRecord } from './historyArchive/layout'
import HistoryObservation from './historyArchive/HistoryObservation'
import HistoryBackdropSquares from './historyArchive/HistoryBackdropSquares'
import './HomeHistory.css'
import useArchiveMotion from './historyArchive/useArchiveMotion'
import { localPoint } from '../../dev/history/interactionMath'
import { HISTORY } from '../../dev/history/config'

const placements = HISTORY_RECORDS.map(record=>({...record.placement,origin:record.interaction.foot}))
const masks = HISTORY_RECORDS.map(record=>Uint8Array.from(atob(record.interaction.bits), char=>char.charCodeAt(0)))

export default function HomeHistory() {
  const [layout, setLayout] = useState(()=>makeStripLayout(placements))
  const [current, setCurrent] = useState(0), [hovered, setHovered] = useState(-1)
  const [selection, setSelection] = useState(null), [closing,setClosing] = useState(false), [notice,setNotice] = useState('')
  const viewport = useRef(null), stage = useRef(null), images = useRef([]), buttons = useRef([]), range = useRef(null)
  const progress = useRef(0), drag = useRef(null), suppress = useRef(0), opener = useRef(null), busy = useRef(false), alive = useRef(true)
  const state = useRef(null), hover = useRef(-1), frame = useRef(0)
  state.current = { layout, selection, closing }
  const [size,setSize]=useState({width:1000,height:layout.height})
  const motion = useArchiveMotion({viewport, buttons, state, hover, records:HISTORY_RECORDS})
  useEffect(()=>{motion.current.wake()},[layout,selection,motion])
  const close = useCallback(()=>setClosing(true),[])
  useLayoutEffect(()=>{alive.current=true;return()=>{alive.current=false;cancelAnimationFrame(frame.current)}},[])
  useLayoutEffect(()=>{
    const observer = new ResizeObserver(()=>{
      const node=viewport.current, next=makeStripLayout(placements,node.clientWidth<700?.22:.28)
      setLayout(next); setSize({width:node.clientWidth,height:next.height})
    })
    observer.observe(viewport.current)
    return()=>observer.disconnect()
  },[])
  useLayoutEffect(()=>{
    const node=viewport.current
    node.scrollLeft=Math.max(0,layout.width-node.clientWidth)*(1-progress.current)
  },[layout])
  const sync = () => {
    cancelAnimationFrame(frame.current)
    frame.current=requestAnimationFrame(()=>{
      if(!viewport.current || !range.current) return
      const node=viewport.current, max=Math.max(0,node.scrollWidth-node.clientWidth)
      progress.current=max?(max-node.scrollLeft)/max:0
      const index=nearestRecord(state.current.layout.items,node.scrollLeft+node.clientWidth/2)
      setCurrent(index)
      range.current.value=String(progress.current*100)
      range.current.setAttribute('aria-valuetext',`${HISTORY_RECORDS[index].name}附近，已探索 ${Math.round(progress.current*100)}%`)
    })
  }
  const pick = event => {
    const node=viewport.current, rect=node.getBoundingClientRect()
    const x=event.clientX-rect.left+node.scrollLeft,y=event.clientY-rect.top
    const candidates=layout.items.map((item,index)=>({item,index})).sort((a,b)=>
      (b.index===hover.current?3:(motion.current.pose(b.index)?.scale||1)>1.001?2:1)-
      (a.index===hover.current?3:(motion.current.pose(a.index)?.scale||1)>1.001?2:1)||b.index-a.index)
    for(const {item,index} of candidates){
      const pose=motion.current.pose(index)
      if(!pose?.entered)continue
      const [u,v]=localPoint(pose,x,y)
      if(maskHit(HISTORY_RECORDS[index].interaction,masks[index],u,v,item.width,item.height)) return index
    }
    return -1
  }
  const setHover = index => {if(hover.current!==index){hover.current=index;setHovered(index);motion.current.wake()}}
  const originFor = index => {
    const item=state.current.layout.items[index], pose=motion.current.pose(index)
    const rect=viewport.current.getBoundingClientRect(), host=stage.current.getBoundingClientRect()
    return {left:rect.left-host.left-stage.current.clientLeft+item.x-viewport.current.scrollLeft,
      top:rect.top-host.top-stage.current.clientTop+item.y+(pose?.entryY||0),width:item.width,height:item.height,
      rotateZ:pose?.rotateZ||0,rotateX:pose?.rotateX||0,scale:pose?.scale||1,transformPerspective:pose?.perspective||728,
      originX:HISTORY_RECORDS[index].interaction.foot[0]/100,originY:HISTORY_RECORDS[index].interaction.foot[1]/100}
  }
  const open = async (index, source) => {
    if(busy.current || selection || index<0) return
    busy.current=true;setNotice('')
    opener.current=source||buttons.current[index]
    try {
      if(!images.current[index].complete || !images.current[index].naturalWidth){const image=new Image();image.src=HISTORY_RECORDS[index].src;await image.decode()}
      if(alive.current){setSelection({index,origin:originFor(index)});setClosing(false);setHover(-1)}
    }catch{if(alive.current)setNotice('這張插畫暫時無法載入，請稍後再試。')}
    finally{busy.current=false}
  }
  const jump = index => {
    const item=layout.items[Math.max(0,Math.min(HISTORY_RECORDS.length-1,index))]
    viewport.current.scrollTo({left:item.x+item.width/2-viewport.current.clientWidth/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
  }
  const changeRecord = async index => {
    if(busy.current || state.current.closing || !HISTORY_RECORDS[index]) return
    const previous=state.current.selection
    busy.current=true
    try {
      const image=new Image();image.src=HISTORY_RECORDS[index].src;await image.decode()
      if(alive.current && state.current.selection===previous && !state.current.closing) setSelection({...previous,index})
    } catch { if(alive.current)setNotice('這張插畫暫時無法載入，請稍後再試。') }
    finally { busy.current=false }
  }
  useEffect(()=>{
    const node=viewport.current
    const wheel=event=>{
      if(state.current.selection || !event.shiftKey || event.ctrlKey || Math.abs(event.deltaX)>Math.abs(event.deltaY))return
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?node.clientWidth:1)
      const next=Math.max(0,Math.min(node.scrollWidth-node.clientWidth,node.scrollLeft+delta))
      if(next!==node.scrollLeft){event.preventDefault();node.scrollLeft=next}
    }
    node.addEventListener('wheel',wheel,{passive:false})
    return()=>node.removeEventListener('wheel',wheel)
  },[])
  const endDrag=event=>{
    const d=drag.current
    if(!d||d.id!==event.pointerId)return
    if(d.moved)suppress.current=Date.now()+350
    drag.current=null;viewport.current.classList.remove('is-dragging')
    if(viewport.current.hasPointerCapture(event.pointerId))viewport.current.releasePointerCapture(event.pointerId)
  }
  return <section id="home-history" className="home-history" aria-labelledby="hh-title">
    <header className="hh-heading"><div className="hh-heading-title"><div className="hh-colour-notes home-geometry-swatches" aria-hidden="true">{['#f08fad','#ffdcc9','#f5f1a4','#80b9e5','#a2d8de','#e1d0f2'].map(color=><i key={color} style={{backgroundColor:color}}/>)}</div><div><p className="edition-kicker">HUMAN CIVILIZATION / FIELD RECORDS</p><h2 id="hh-title">地球文明史<em>沿著足跡，觀察世界。</em></h2></div></div><div className="hh-heading-note"><p>大家好不容易按時間一點一滴整理的資料！</p><label>年代索引 <select value={selection?.index ?? current} onChange={event=>jump(Number(event.target.value))} disabled={Boolean(selection)} aria-label="選擇長卷中的時代">{HISTORY_RECORDS.map(record=><option key={record.id} value={record.index}>{String(record.index+1).padStart(2,'0')} / {record.name}</option>)}</select></label></div></header>
    <div className="hh-display-mat">
    <div className="hh-scroll-label"><span>THE HUMAN STORY</span><span>文明觀察室 <i>✧</i> 研究卷 01</span></div>
    <div ref={stage} className="hh-stage" style={{height:layout.height,'--hh-person-shadow':`${HISTORY.shadow.x*layout.scale}px ${HISTORY.shadow.y*layout.scale}px ${HISTORY.shadow.blur*layout.scale}px ${HISTORY.shadow.color}`}} data-observing={Boolean(selection)}>
      <HistoryBackdropSquares height={layout.baseline+9}/>
      <div className="hh-panorama" inert={Boolean(selection)}>
        <svg className="hh-stage-dots" viewBox="0 0 62 31" aria-hidden="true">{[0,1].flatMap(row=>[0,1,2,3].map(column=><circle key={`${row}-${column}`} cx={column*15.5+4} cy={row*15.5+4} r="1.75" fill="#b98f994f"/>))}</svg>
        <div ref={viewport} className="hh-viewport" onScroll={sync} onPointerDown={event=>{if(event.button!==0||!event.isPrimary||selection)return;drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,scroll:viewport.current.scrollLeft,moved:false}}} onPointerMove={event=>{
          motion.current.pointer(event)
          const d=drag.current
          if(d){if(d.id!==event.pointerId)return;const dx=event.clientX-d.x;if(!d.moved&&Math.abs(dx)>6){d.moved=true;viewport.current.setPointerCapture(event.pointerId);viewport.current.classList.add('is-dragging');setHover(-1)}if(d.moved)viewport.current.scrollLeft=d.scroll-dx}
          else setHover(pick(event))
        }} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onPointerLeave={()=>{if(!drag.current)setHover(-1);motion.current.leave()}} onClick={event=>{if(event.detail!==0 && Date.now()>suppress.current)open(pick(event))}}>
          <div className="hh-world" style={{width:layout.width,height:layout.height,'--hh-baseline':`${layout.baseline}px`}}><div className="hh-ground" aria-hidden="true"/>{layout.items.map((item,index)=>{
            const record=HISTORY_RECORDS[index]
            return <div key={record.id} className={`hh-actor${hovered===index?' is-hovered':''}`} style={{left:item.x,top:item.y,width:item.width,height:item.height}}>
              <div className="hh-entry"><button style={{transformOrigin:`${record.interaction.foot[0]}% ${record.interaction.foot[1]}%`}} ref={node=>{buttons.current[index]=node}} type="button" className="hh-person-button" aria-label={`觀察${record.name}，${record.date}`} onClick={event=>{if(event.detail===0)open(index,event.currentTarget)}} onFocus={()=>setHover(index)} onBlur={()=>setHover(-1)}>
                <img ref={node=>{images.current[index]=node}} src={record.src} alt="" width="2109" height="2984" loading="lazy" decoding="async" draggable="false" style={{opacity:selection?.index===index?0:1}}/>
              </button></div><span className="hh-person-caption" style={{top:layout.height-item.y-28}}><small>{String(index+1).padStart(2,'0')}</small>{record.name}</span>
              <span className="hh-hover-label" aria-hidden="true">{record.name}<small>{record.date}</small></span>
            </div>
          })}</div>
        </div>
        <div className="hh-edge-label" aria-hidden="true">← 朝向更近的年代</div>
      </div>
      {selection && <HistoryObservation selection={selection} size={size} closing={closing} originFor={originFor} onClose={close} onChange={changeRecord} onClosed={()=>{setSelection(null);setClosing(false);requestAnimationFrame(()=>opener.current?.focus({preventScroll:true}))}}/>}
    </div>
    <div className="hh-navigation" inert={Boolean(selection)}><button type="button" onClick={()=>jump(Math.min(HISTORY_RECORDS.length-1,current+2))} aria-label="向較近的年代探索"><span className="hh-explore-triangle" aria-hidden="true">◀</span></button><div className="hh-progress"><label htmlFor="hh-progress">{String(current+1).padStart(2,'0')} / {HISTORY_RECORDS.length} <span>{HISTORY_RECORDS[current].name}</span></label><input ref={range} id="hh-progress" type="range" min="0" max="100" step=".1" defaultValue="0" dir="rtl" aria-label="探索歷史長卷的進度" onChange={event=>{const max=viewport.current.scrollWidth-viewport.current.clientWidth;viewport.current.scrollLeft=max*(1-Number(event.target.value)/100)}}/></div><button type="button" onClick={()=>jump(Math.max(0,current-2))} aria-label="向較早的年代探索"><span className="hh-explore-triangle" aria-hidden="true">▶</span></button><p>拖曳長卷 · 橫向滑動 · Shift＋滾輪<br/><span>點擊人物就可以查看大家整理出的資料喔！</span></p></div>
    <p className="hh-context">各時期與地區的發展可能重疊，圖示間距不代表實際時間比例。</p>
    </div>
    {notice&&<p className="hh-load-error" role="alert">{notice}</p>}
  </section>
}
