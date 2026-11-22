import { useLayoutEffect, useRef } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import './CharacterDialogue.css'

// Only this session's prefix is considered, so previous works cannot leak in.
export function latestCharacterLines(dialogue, index) {
  const result = {}
  for (let i = 0; i <= Math.min(index, dialogue.length - 1); i++) {
    result[dialogue[i].speaker] = { ...dialogue[i], cueIndex: i }
  }
  return result
}

export default function CharacterDialogue({ character, entry, active, onAdvance, action }) {
  const controls = useAnimationControls()
  const reduced = useReducedMotion()
  const appeared = useRef(false)
  useLayoutEffect(() => {
    controls.stop()
    if (reduced) controls.set({ opacity: 1, scale: 1, y: 0 })
    else if (!appeared.current) {
      controls.set({ opacity: 0, scale: .94, y: 14 })
      controls.start({ opacity: 1, scale: [ .94, 1.025, 1 ], y: [14, -3, 0], transition: { duration: .32, times: [0,.65,1], ease: 'easeOut' } })
    } else if (active) {
      controls.start({ opacity: 1, scale: [ .985, 1.018, 1 ], y: [0, -3, 0], transition: { duration: .25, times: [0,.55,1], ease: 'easeOut' } })
    } else controls.start({ opacity: 1, scale: 1, y: 0, transition: { duration: .14 } })
    appeared.current = true
    return () => controls.stop()
  }, [controls, reduced, entry.cueIndex, active])

  return <div className={`ball-character-dialogue-slot ball-character-dialogue-slot-${character.side}`}>
    <motion.button type="button" className="ball-character-dialogue" data-speaker={character.id} data-active={active} data-dev-text-dynamic
      initial={{ opacity: 0 }} animate={controls} whileTap={!reduced ? { scale: .975 } : undefined}
      onClick={onAdvance} aria-label={`${character.name}：${entry.text}。點擊推進對話，${action}`}>
      <span className="ball-character-dialogue-heading"><strong>{character.name}</strong><i aria-hidden="true"/></span>
      <motion.span key={entry.cueIndex} className="ball-character-dialogue-text" aria-live={active ? 'polite' : 'off'}
        initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .16 }}>
        {entry.text}
      </motion.span>
      <span className="ball-character-dialogue-footer" aria-hidden="true">{active && <><span>CLICK TO CONTINUE</span><span className="ball-character-dialogue-cue">▸</span></>}</span>
    </motion.button>
  </div>
}
