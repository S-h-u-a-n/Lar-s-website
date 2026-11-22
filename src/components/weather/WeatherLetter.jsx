import { useId, useLayoutEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { WEATHER_LETTER } from './letterContent'
import { markWeatherLetterSeen } from './letterSession'
import './WeatherLetter.css'

export default function WeatherLetter({ onClose, returnFocus }) {
  const dialog = useRef(null), closeButton = useRef(null)
  const titleId = useId(), reduced = useReducedMotion()
  useLayoutEffect(() => {
    const element = dialog.current
    // The native modal keeps the whole background inert, including during exit.
    element.showModal()
    markWeatherLetterSeen()
    closeButton.current?.focus({ preventScroll: true })
    return () => {
      element.close()
      if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true })
    }
  }, [returnFocus])

  return <motion.dialog ref={dialog} className="wp-letter-overlay" aria-labelledby={titleId} aria-modal="true"
    initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reduced ? 0 : .28 }}
    onCancel={event => { event.preventDefault(); onClose() }}
    onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <motion.div className="wp-letter-composition"
      initial={reduced ? false : { y: 18, scale: .98, scaleY: .97 }}
      animate={{ y: 0, scale: 1, scaleY: 1 }} exit={{ y: 10, scale: .99, scaleY: .98 }}
      transition={{ duration: reduced ? 0 : .38, ease: [.22, .75, .25, 1] }}>
      <button ref={closeButton} type="button" className="wp-letter-close" aria-label="關閉信件" onClick={onClose}>×</button>
      <div className="wp-letter-scroll">
        <article className="wp-letter-paper">
          <div className="wp-letter-stationery" aria-hidden="true"><i /><i /><i /></div>
          <header className="wp-letter-heading">
            <div className="wp-letter-emblem" aria-hidden="true"><span>✧</span></div>
            <h2 id={titleId}>{WEATHER_LETTER.title}</h2>
          </header>
          <div className="wp-letter-body">
            {WEATHER_LETTER.body.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <footer className="wp-letter-signature">{WEATHER_LETTER.signature}</footer>
        </article>
        <aside className="wp-letter-discussion" aria-label="研究室成員的對話">
          {WEATHER_LETTER.discussion.map(line => <p key={line}>{line}</p>)}
        </aside>
      </div>
    </motion.div>
  </motion.dialog>
}
