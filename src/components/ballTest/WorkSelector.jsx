/** Adapted from Skiper UI Skiper53 / HoverExpand_002, author @gurvinder-singh02.
 * https://skiper-ui.com/v1/skiper53 — free personal/commercial use and modification;
 * attribution required. Original demo artwork and unused Swiper imports are omitted.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SELECTOR } from './data'
import Text from './Text'
export function Cover({ work }) {
  return work.cover ? <img src={work.cover} alt={work.name}/> : <div className={`ball-cover-placeholder ball-cover-${work.pattern}`} style={{ backgroundColor: work.color }}><span aria-hidden="true"/><strong>{work.name}</strong></div>
}
export default function WorkSelector({ works, selectedIndex, hoveredId, onHover, onStep, onOpen }) {
  const ref = useRef(null), [height, setHeight] = useState(300), reduced = useReducedMotion()
  useLayoutEffect(() => { const observer = new ResizeObserver(() => setHeight(ref.current.clientHeight)); observer.observe(ref.current); return () => observer.disconnect() }, [])
  const count = Math.min(SELECTOR.visibleCount, works.length)
  const visible = Array.from({ length: count }, (_, offset) => works[(selectedIndex + offset) % works.length])
  const available = Math.max(1, height - SELECTOR.gap * (count - 1))
  const expanded = hoveredId && visible.some(work => work.id === hoveredId)
  return <section className="ball-selector" aria-label="Work selector"><button className="ball-arrow" onClick={() => onStep(-1)}><Text id="previous">↑ PREVIOUS</Text></button><div className="ball-cover-window" ref={ref} style={{ gap: SELECTOR.gap }} onMouseLeave={() => onHover(null)}><AnimatePresence initial={false} mode="popLayout">{visible.map(work => <motion.button layout key={work.id} className={`ball-cover ${works[selectedIndex].id === work.id ? 'is-selected' : ''}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0, height: expanded ? hoveredId === work.id ? available * (count === 1 ? 1 : SELECTOR.expandedRatio) : available * (1 - SELECTOR.expandedRatio) / Math.max(1, count - 1) : available / count }} exit={{ opacity: 0, y: -18 }} transition={{ duration: reduced ? 0 : SELECTOR.duration, ease: SELECTOR.easing }} onHoverStart={() => onHover(work.id)} onHoverEnd={() => onHover(null)} onFocus={() => onHover(work.id)} onBlur={() => onHover(null)} onClick={() => onOpen(work)} aria-label={`Open ${work.name}`} aria-current={works[selectedIndex].id === work.id ? 'true' : undefined}><Cover work={work}/></motion.button>)}</AnimatePresence></div><button className="ball-arrow" onClick={() => onStep(1)}><Text id="next-work">↓ NEXT WORK</Text></button><a className="ball-credit" href="https://skiper-ui.com/v1/skiper53" target="_blank" rel="noreferrer"><Text id="credit">Selector adapted from Skiper UI</Text></a></section>
}
