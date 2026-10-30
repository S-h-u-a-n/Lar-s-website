import { useEffect, useLayoutEffect, useRef } from 'react'
import Text from './Text'
import { ALL_CHAPTERS, CHARACTERS } from './data'
export default function StoryDialog({ chapterId, line, onNext, onClose }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const logRef = useRef(null)
  const followLatest = useRef(true)
  const previousChapter = useRef(null)
  const previousScrollTop = useRef(0)
  const active = Boolean(chapterId)
  useLayoutEffect(() => {
    const log = logRef.current
    if (!active || !log) { previousChapter.current = null; return }
    const opening = previousChapter.current !== chapterId
    if (opening) previousScrollTop.current = 0
    if (opening || followLatest.current) {
      log.scrollTo({ top: log.scrollHeight, behavior: opening || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
    if (opening) followLatest.current = true
    previousChapter.current = chapterId
  }, [active, chapterId, line])
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    const keydown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const buttons = [...dialogRef.current.querySelectorAll('button, [tabindex="0"]')].filter(b => !b.closest('[hidden]'))
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
      </div>)}
      <div ref={logRef} className="gt-chat-log" role="log" aria-label="Student conversation" aria-live="polite" aria-relevant="additions" tabIndex={0}
        onWheel={event => { if (event.deltaY < 0) followLatest.current = false }}
        onScroll={event => {
          const el = event.currentTarget
          if (el.scrollTop < previousScrollTop.current) followLatest.current = false
          if (el.scrollHeight - el.scrollTop - el.clientHeight <= 32) followLatest.current = true
          previousScrollTop.current = el.scrollTop
        }}>
      {ALL_CHAPTERS.map(ch => <div key={ch.id} hidden={chapterId !== ch.id}>
        {ch.dialogue.map((entry,index) => { const character = CHARACTERS[entry.character]; return <div className="gt-dialogue" key={entry.id} hidden={line < index} style={{ '--gt-character-color': character.color }}>
          <div className="gt-avatar" aria-hidden="true" style={{ background: character.avatar || character.initials ? character.color : 'transparent' }}>{character.avatar ? <img src={character.avatar} alt="" /> : character.initials}</div>
          <div><Text id={`character-${ch.id}-${entry.id}`} as="h3">{character.name}</Text><Text id={`dialogue-${ch.id}-${entry.id}`} as="p" className="gt-bubble">{entry.text}</Text></div>
        </div> })}
      </div>)}
      </div>
      <footer><button onClick={last ? onClose : onNext}><Text id="story-next" hidden={last}>NEXT</Text><Text id="story-finish" hidden={!last}>FINISH</Text></button></footer>
    </section>
  </div>
}
