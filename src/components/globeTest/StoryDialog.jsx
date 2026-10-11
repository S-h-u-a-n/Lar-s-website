import { useEffect, useRef } from 'react'
import Text from './Text'
import { ALL_CHAPTERS, CHARACTERS } from './data'
export default function StoryDialog({ chapterId, line, onNext, onClose }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const active = Boolean(chapterId)
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    const keydown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const buttons = [...dialogRef.current.querySelectorAll('button')].filter(b => !b.closest('[hidden]'))
        const index = buttons.indexOf(document.activeElement)
        event.preventDefault(); buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => { window.removeEventListener('keydown', keydown); previous?.focus?.({ preventScroll: true }) }
  }, [active, onClose])
  const chapter = ALL_CHAPTERS.find(ch => ch.id === chapterId)
  const last = chapter && line === chapter.dialogue.length - 1
  return <div className={`gt-story-layer${active ? ' is-open' : ''}`} aria-hidden={!active} inert={!active}>
    <div className="gt-story-scrim" onClick={onClose} />
    <section ref={dialogRef} className="gt-story-dialog" role="dialog" aria-modal="true" aria-labelledby={chapterId ? `gt-title-${chapterId}` : undefined}>
      <header><Text id="story-label">The students' little theatre</Text><button ref={closeRef} onClick={onClose}><Text id="story-close">CLOSE</Text></button></header>
      {ALL_CHAPTERS.map(ch => <div key={ch.id} hidden={chapterId !== ch.id}>
        <Text id={`story-title-${ch.id}`} htmlId={`gt-title-${ch.id}`} as="h2">{ch.title}</Text>
        <div className="gt-story-illustration" aria-hidden="true">{ch.background && <img src={ch.background} alt="" />}</div>
        {ch.dialogue.map((entry,index) => { const character = CHARACTERS[entry.character]; return <div className="gt-dialogue" key={entry.id} hidden={line !== index}>
          <div className="gt-avatar" aria-hidden="true" style={{ background: character.color }}>{character.avatar ? <img src={character.avatar} alt="" /> : character.initials}</div>
          <div><Text id={`character-${ch.id}-${entry.id}`} as="h3">{character.name}</Text><Text id={`dialogue-${ch.id}-${entry.id}`} as="p" className="gt-bubble">{entry.text}</Text></div>
        </div> })}
      </div>)}
      <footer><button onClick={last ? onClose : onNext}><Text id="story-next" hidden={last}>NEXT</Text><Text id="story-finish" hidden={!last}>FINISH</Text></button></footer>
    </section>
  </div>
}
