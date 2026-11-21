import { useEffect, useRef } from 'react'
import { motion, useIsPresent, useReducedMotion } from 'framer-motion'
import ReadingPhoto from '../research/ReadingPhoto'
import photos from './solarPhotos.json'

// AnimatePresence retains the native dialog and its focus trap until both exits finish.
export default function SolarScaleDialog({ onClose }) {
  const dialog = useRef(null)
  const close = useRef(null)
  const reduced = useReducedMotion()
  const present = useIsPresent()
  const transition = { duration: reduced ? 0 : .38, ease: [.22, 1, .36, 1] }
  useEffect(() => {
    const previous = document.activeElement
    const element = dialog.current
    element.showModal()
    close.current?.focus({ preventScroll: true })
    return () => {
      element.close()
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  const dismiss = () => { if (present) onClose() }
  return <dialog ref={dialog} className="gt-scale-dialog" aria-labelledby="gt-scale-title" aria-describedby="gt-scale-description" onCancel={event => { event.preventDefault(); dismiss() }}>
    <motion.div className="gt-scale-scrim" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition} onClick={dismiss}/>
    <motion.section className="gt-scale-card" inert={!present}
      initial={{ opacity: 0, y: reduced ? 0 : 18, scale: reduced ? 1 : .98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : .98 }}
      transition={transition}>
      <header className="gt-scale-top"><span>B-612 / OBSERVATION NOTES</span><button ref={close} className="gt-scale-close" aria-label="關閉太陽系比例說明" onClick={dismiss} autoFocus>收起筆記 <span aria-hidden="true">×</span></button></header>
      <div className="gt-scale-copy">
        <span className="gt-scale-tab">觀測前的小提醒</span>
        <h2 id="gt-scale-title">太陽系比例說明<span aria-hidden="true">✧</span></h2>
        <p id="gt-scale-description">為了方便觀測，所以把地球做成最大的了！但實際的大小比例是如圖所示喔！</p>
        <ReadingPhoto content={photos['solar-system']}/>
      </div>
      <footer className="gt-scale-footer"><span>SOLAR SYSTEM / SCALE STUDY</span><span aria-hidden="true">● ● ●</span></footer>
    </motion.section>
  </dialog>
}
