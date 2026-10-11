import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CATEGORIES, SELECTOR } from './data'
import { Cover } from './WorkSelector'
import Text from './Text'
export default function WorkDialog({ work, onClose }) {
  const panel = useRef(null), previous = useRef(null), reduced = useReducedMotion()
  useEffect(() => {
    if (!work) return
    previous.current = document.activeElement
    panel.current?.querySelector('button')?.focus({ preventScroll: true })
    const key = event => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const buttons = [...panel.current.querySelectorAll('button, a, [tabindex="0"]')]
      const first = buttons[0], last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('keydown', key); previous.current?.focus({ preventScroll: true }) }
  }, [work, onClose])
  return <div inert={!work} className="edition-work-modal-host" style={{pointerEvents:work?'auto':'none'}}><AnimatePresence>{work && <motion.div className="ball-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : SELECTOR.duration }} onClick={event => { if (event.target === event.currentTarget) onClose() }}><motion.section ref={panel} className="ball-work-dialog" style={{transformPerspective:1100,transformOrigin:"left center"}} role="dialog" aria-modal="true" aria-labelledby="ball-work-title" initial={{ opacity: 0, y: 24, scale: .98, rotateY: reduced ? 0 : -12 }} animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }} exit={{ opacity: 0, y: 16, scale: .98, rotateY: reduced ? 0 : 6 }} transition={{ duration: reduced ? 0 : SELECTOR.duration, ease: SELECTOR.easing }}><header><Text id="details">ON OUR SHELF</Text><button onClick={onClose}><Text id="close">CLOSE ×</Text></button></header><div className="ball-work-scroll"><div className="ball-work-art"><Cover work={work}/></div><div><small>{CATEGORIES.find(category => category.id === work.category)?.name}</small><h2 id="ball-work-title">{work.name}</h2><p>{work.originalTitle}</p><p>{work.summary}</p>{work.description.map((text, index) => <p key={index}>{text}</p>)}<section className="ball-reason"><Text as="h3" id="reason">WHY WE LOVE IT</Text><p>{work.recommendation}</p></section>{work.illustration && <img src={work.illustration} alt={work.name}/>}</div></div></motion.section></motion.div>}</AnimatePresence></div>
}
