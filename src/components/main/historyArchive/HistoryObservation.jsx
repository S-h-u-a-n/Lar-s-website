import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HISTORY_RECORDS } from './data'
import { adjacentRecord } from './layout'

export default function HistoryObservation({ selection, items, size, closing, originFor, onChange, onClose, onClosed }) {
  const record = HISTORY_RECORDS[selection.index], reduced = useReducedMotion()
  const leftIndex = adjacentRecord(items, selection.index, 'left')
  const rightIndex = adjacentRecord(items, selection.index, 'right')
  const close = useRef(null), scroll = useRef(null), first = useRef(true)
  const visibleHeight = Math.min(size.height - (size.width < 600 ? 90 : 52), size.width < 600 ? 230 : 385)
  const [l,t,r,b] = record.placement.bounds
  const height = visibleHeight * 2984 / (b-t), width = height * 2109/2984
  const target = { left:size.width*.205-(l+r)/2/2109*width, top:(size.height-visibleHeight)/2-12-t/2984*height,
    width,height,rotateZ:0,rotateX:0,scale:1,transformPerspective:728,
    originX:record.interaction.foot[0]/100,originY:record.interaction.foot[1]/100 }
  const destination = closing ? originFor(selection.index) : target
  useEffect(() => {
    close.current?.focus({ preventScroll: true })
    const key = event => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])
  useEffect(() => {
    first.current = false
    scroll.current?.scrollTo({ top: 0, behavior: 'instant' })
    for (const index of [leftIndex, rightIndex]) {
      if (index === null) continue
      const image = new Image(); image.src = HISTORY_RECORDS[index].src
      image.decode().catch(() => {})
    }
  }, [selection.index, leftIndex, rightIndex])
  return <div className="hh-observation" role="dialog" aria-modal="false" aria-labelledby="hh-detail-title" aria-label="歷史觀察模式">
    <motion.div className="hh-observation-paper" initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }} transition={{duration: reduced ? 0 : .25}}/>
    <div className="hh-detail-orbit hc-orbit" aria-hidden="true" style={{opacity:closing?0:1}}><span>✧</span><i/><i/><p>OBSERVATION<br/>{String(selection.index+1).padStart(2,'0')}</p></div>
    <AnimatePresence>
      <motion.img className="hh-observed-person" key={record.id} src={record.src} alt={`${record.name}時代意象插畫`} initial={first.current ? { ...selection.origin, opacity: 1 } : { ...target, opacity: 0 }} animate={{ ...destination, opacity: 1 }} exit={{opacity:0}} transition={{ duration: reduced ? 0 : .55, ease: [.22,.75,.25,1] }} onAnimationComplete={() => { if (closing) onClosed() }}/>
    </AnimatePresence>
    <nav className="hh-figure-nav" aria-label="人物旁時代切換" style={{opacity:closing?0:1}}>
      <motion.button type="button" aria-label="左側人物" disabled={closing||leftIndex===null} onClick={()=>onChange(leftIndex)} whileHover={reduced?{}:{x:-3}} whileTap={reduced?{}:{scale:.9}}>◀</motion.button>
      <motion.button type="button" aria-label="右側人物" disabled={closing||rightIndex===null} onClick={()=>onChange(rightIndex)} whileHover={reduced?{}:{x:3}} whileTap={reduced?{}:{scale:.9}}>▶</motion.button>
    </nav>
    <motion.div className="hh-detail-panel" initial={{ opacity: 0, x: reduced ? 0 : 16 }} animate={{ opacity: closing ? 0 : 1, x: 0 }} transition={{ duration: reduced ? 0 : .35, delay: closing || reduced ? 0 : .12 }}>
      <span className="hh-detail-tape ha-tape" aria-hidden="true"/>
      <div className="hh-detail-top"><span>HUMAN CIVILIZATION / FIELD NOTE</span><button ref={close} type="button" disabled={closing} onClick={onClose} aria-label="關閉歷史觀察">收起 ×</button></div>
      <div className="hh-detail-scroll" ref={scroll} tabIndex={0} aria-label="時代詳細資料，可捲動">
        <AnimatePresence mode="wait" initial={false}><motion.article key={record.id} initial={{opacity:0,y:reduced?0:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduced?0:.16}}>
          <p className="hh-region">{record.region}</p><h3 id="hh-detail-title">{record.name}</h3><p className="hh-date">{record.date}</p><p className="hh-summary">{record.summary}</p>
          {record.sections.map(section => <section key={section.title} className="hh-research-section">
            <h4>{section.title}</h4>
            {section.paragraphs.map(text => <p className="hh-explanation" key={text}>{text}</p>)}
          </section>)}
          {record.note && <aside className="hh-note"><h4>頁邊觀察 <span>✧</span></h4><p>{record.note}</p></aside>}
          <p className="hh-illustration-note">{record.illustrationNote}</p>
          <details className="hh-sources" key={record.id}><summary>參考資料 · Wikipedia ↗</summary><div><p className="hh-source-note">{record.sourceNote}（核對：{record.verifiedAt}）</p>{record.references.map(source=><a key={source.id} href={source.href} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}</div></details>
        </motion.article></AnimatePresence>
      </div>
      <nav className="hh-detail-nav" aria-label="切換觀察時代"><button type="button" disabled={closing || leftIndex===null} onClick={()=>onChange(leftIndex)}>← Prev</button><span>{selection.index+1} / {HISTORY_RECORDS.length}</span><button type="button" disabled={closing || rightIndex===null} onClick={()=>onChange(rightIndex)}>Next →</button></nav>
    </motion.div>
  </div>
}
