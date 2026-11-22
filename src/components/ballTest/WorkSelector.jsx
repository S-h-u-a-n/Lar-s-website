/** Adapted from Skiper UI Skiper53 / HoverExpand_002, author @gurvinder-singh02.
 * https://skiper-ui.com/v1/skiper53 — free personal/commercial use and modification;
 * attribution required. Original demo artwork and unused Swiper imports are omitted.
 */
import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { photoUrl } from '../research/photoUrl.js'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion'
import { SELECTOR } from './data'
import Text from './Text'
import { visibleWorkEntries, wrapWorkIndex } from './workNavigation'
export function Cover({ work, mode = 'preview' }) {
  const poster = mode === 'detail' ? work.posterDetail : work.posterPreview || work.cover
  const objectPosition = mode === 'hover' ? work.posterHoverPosition || work.posterPreviewPosition : work.posterPreviewPosition
  const isDetail = mode === 'detail'
  return <>
    {poster ? <img className={`ball-cover-image${isDetail ? ' ball-cover-image--detail' : ''}`} src={photoUrl(poster)} alt={work.name} loading={isDetail ? 'eager' : 'lazy'} decoding="async" style={isDetail ? undefined : { objectPosition }}/>
      : <div className={`ball-cover-placeholder ball-cover-${work.pattern}${work.category === 'music' ? ' ball-cover-placeholder--song' : ''}`} style={{ backgroundColor: work.color }}><span aria-hidden="true"/>{isDetail && (work.category === 'music' ? <div className="ball-cover-song-copy"><strong>{work.name}</strong><small>{work.artist}</small></div> : <strong>{work.name}</strong>)}</div>}
    {!isDetail && <span className="ball-cover-overlay" aria-hidden="true"><strong>{work.originalTitle || work.name}</strong></span>}
  </>
}
const SlidingWorkCard = forwardRef(function SlidingWorkCard({ work, selected, height, direction, reduced, onOpen }, ref) {
  const present = useIsPresent()
  const travel = height + SELECTOR.gap
  return <motion.button ref={ref} layout type="button"
    className={`ball-cover${work.posterPreview ? ' ball-cover--poster' : ''} ${selected ? 'is-selected' : ''}`}
    custom={direction} initial={{ y: direction * travel, height }} animate={{ y: 0, height }}
    exit="depart" variants={{ depart: movement => ({ y: -movement * travel }) }}
    transition={{ duration: reduced ? 0 : SELECTOR.duration, ease: SELECTOR.easing }}
    disabled={!present} style={{ pointerEvents: present ? 'auto' : 'none' }}
    onClick={() => onOpen(work)} aria-label={`${selected ? '查看詳情：' : '展開並開始對話：'}${work.name}`}
    aria-expanded={selected} aria-current={selected ? 'true' : undefined} aria-hidden={!present || undefined}>
    <Cover work={work} mode={selected ? 'hover' : 'preview'}/>
  </motion.button>
})

export default function WorkSelector({ works, start, direction, expandedWorkId, onStep, onSelectWindow, onOpen }) {
  const ref = useRef(null), [height, setHeight] = useState(300), reduced = useReducedMotion()
  useLayoutEffect(() => {
    const measure = () => setHeight(ref.current.clientHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  const visible = visibleWorkEntries(works, start, SELECTOR.visibleCount)
  const count = visible.length
  const available = Math.max(1, height - SELECTOR.gap * (count - 1))
  const expanded = visible.some(({work}) => work.id === expandedWorkId)
  const firstIndex = wrapWorkIndex(start, works.length)
  return <section className="ball-selector" aria-label="Work selector">
    <button className="ball-arrow" onClick={() => onStep(-1)}><Text id="previous">↑ PREVIOUS</Text></button>
    <div className="ball-selector-content">
      <div className="ball-cover-window" ref={ref} style={{ gap: SELECTOR.gap }}>
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>{visible.map(({work,position}) => {
          const selected = expandedWorkId === work.id
          const cardHeight = expanded ? selected ? available * (count === 1 ? 1 : SELECTOR.expandedRatio) : available * (1 - SELECTOR.expandedRatio) / Math.max(1,count - 1) : available / count
          return <SlidingWorkCard key={position} work={work} selected={selected} height={cardHeight} direction={direction} reduced={reduced} onOpen={onOpen}/>
        })}</AnimatePresence>
      </div>
      {works.length > SELECTOR.visibleCount && <aside className="ball-group-progress" aria-label="作品列表位置">
        <span className="ball-group-progress-count" aria-live="polite">{firstIndex + 1} / {works.length}</span>
        <div className="ball-group-progress-track">
          {works.map((work,index) => <button key={work.id} aria-label={`從第 ${index + 1} 件作品開始顯示`} aria-current={index === firstIndex ? 'step' : undefined} onClick={() => onSelectWindow(index)}><span/></button>)}
        </div>
      </aside>}
    </div>
    <button className="ball-arrow" onClick={() => onStep(1)}><Text id="next-work">↓ NEXT</Text></button>
  </section>
}

export function SelectorCredit() {
  return <a className="ball-credit" href="https://skiper-ui.com/v1/skiper53" target="_blank" rel="noreferrer"><Text id="credit">Selector adapted from Skiper UI</Text></a>
}
