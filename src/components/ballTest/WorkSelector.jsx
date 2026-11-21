/** Adapted from Skiper UI Skiper53 / HoverExpand_002, author @gurvinder-singh02.
 * https://skiper-ui.com/v1/skiper53 — free personal/commercial use and modification;
 * attribution required. Original demo artwork and unused Swiper imports are omitted.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SELECTOR } from './data'
import Text from './Text'
export function Cover({ work, mode = 'preview' }) {
  const poster = mode === 'detail' ? work.posterDetail : work.posterPreview || work.cover
  const objectPosition = mode === 'hover' ? work.posterHoverPosition || work.posterPreviewPosition : work.posterPreviewPosition
  return poster ? <><img className={`ball-cover-image${mode === 'detail' ? ' ball-cover-image--detail' : ''}`} src={poster} alt={work.name} style={mode === 'detail' ? undefined : { objectPosition }}/>{mode !== 'detail' && work.posterPreviewTitle && <strong className="ball-cover-title" aria-hidden="true">{work.posterPreviewTitle}</strong>}</> : <div className={`ball-cover-placeholder ball-cover-${work.pattern}${work.category === 'music' ? ' ball-cover-placeholder--song' : ''}`} style={{ backgroundColor: work.color }}><span aria-hidden="true"/>{work.category === 'music' ? <div className="ball-cover-song-copy"><strong>{work.name}</strong><small>{work.artist}</small></div> : <strong>{work.name}</strong>}</div>
}
export default function WorkSelector({ works, selectedIndex, hoveredId, onHover, onStep, onSelectGroup, onOpen }) {
  const ref = useRef(null), [height, setHeight] = useState(300), reduced = useReducedMotion()
  useLayoutEffect(() => { const observer = new ResizeObserver(() => setHeight(ref.current.clientHeight)); observer.observe(ref.current); return () => observer.disconnect() }, [])
  const groupCount = Math.ceil(works.length / SELECTOR.visibleCount)
  const groupIndex = Math.floor(selectedIndex / SELECTOR.visibleCount)
  const firstIndex = groupIndex * SELECTOR.visibleCount
  const visible = works.slice(firstIndex, firstIndex + SELECTOR.visibleCount)
  const count = visible.length
  const available = Math.max(1, height - SELECTOR.gap * (count - 1))
  const expanded = hoveredId && visible.some(work => work.id === hoveredId)
  return <section className="ball-selector" aria-label="Work selector">
    <button className="ball-arrow" onClick={() => onStep(-1)}><Text id="previous">↑ PREVIOUS</Text></button>
    <div className="ball-selector-content">
      <div className="ball-cover-window" ref={ref} style={{ gap: SELECTOR.gap }} onMouseLeave={() => onHover(null)}>
        <AnimatePresence initial={false} mode="popLayout">{visible.map(work => <motion.button layout key={work.id} className={`ball-cover${work.posterPreview ? ' ball-cover--poster' : ''} ${works[selectedIndex].id === work.id ? 'is-selected' : ''}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0, height: expanded ? hoveredId === work.id ? available * (count === 1 ? 1 : SELECTOR.expandedRatio) : available * (1 - SELECTOR.expandedRatio) / Math.max(1, count - 1) : available / count }} exit={{ opacity: 0, y: -18 }} transition={{ duration: reduced ? 0 : SELECTOR.duration, ease: SELECTOR.easing }} onHoverStart={() => onHover(work.id)} onHoverEnd={() => onHover(null)} onFocus={() => onHover(work.id)} onBlur={() => onHover(null)} onClick={() => onOpen(work)} aria-label={`Open ${work.name}`} aria-current={works[selectedIndex].id === work.id ? 'true' : undefined}>
          <Cover work={work} mode={hoveredId === work.id ? 'hover' : 'preview'}/>
        </motion.button>)}</AnimatePresence>
      </div>
      {groupCount > 1 && <aside className="ball-group-progress" aria-label="作品組別進度">
        <span className="ball-group-progress-count" aria-live="polite">{groupIndex + 1} / {groupCount}</span>
        <div className="ball-group-progress-track">
          {Array.from({ length: groupCount }, (_, index) => <button key={index} aria-label={`前往第 ${index + 1} 組，共 ${groupCount} 組`} aria-current={index === groupIndex ? 'step' : undefined} onClick={() => onSelectGroup(index)}><span/></button>)}
        </div>
      </aside>}
    </div>
    <button className="ball-arrow" onClick={() => onStep(1)}><Text id="next-work">↓ NEXT</Text></button>
  </section>
}

export function SelectorCredit() {
  return <a className="ball-credit" href="https://skiper-ui.com/v1/skiper53" target="_blank" rel="noreferrer"><Text id="credit">Selector adapted from Skiper UI</Text></a>
}
