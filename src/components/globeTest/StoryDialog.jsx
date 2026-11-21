import { useEffect, useLayoutEffect, useRef } from 'react'
import Text from './Text'
import { ALL_CHAPTERS, CHARACTERS } from './data'
import { isStoryPlayable } from './globeContentParser'
import { findCharacterProfile } from '../../dev/characters/characters'
export default function StoryDialog({ chapterId, line, onNext, onClose, onOpenCharacter }) {
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
      if (document.querySelector('dialog[open]')) return
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
  const playable = chapter && isStoryPlayable(chapter)
  const last = chapter && (!playable || line >= chapter.dialogue.length - 1)
  return <div className={`gt-story-layer${active ? ' is-open' : ''}`} aria-hidden={!active} inert={!active}>
    <div className="gt-story-scrim" onClick={onClose} />
    <section ref={dialogRef} className="gt-story-dialog" role="dialog" aria-modal="true" aria-labelledby={chapterId ? `gt-title-${chapterId}` : undefined}>
      <header><Text id="story-label">The students' little theatre</Text><button ref={closeRef} onClick={onClose}><Text id="story-close">CLOSE</Text></button></header>
      {ALL_CHAPTERS.map(ch => <div key={ch.id} hidden={chapterId !== ch.id}>
        <h2 id={`gt-title-${ch.id}`}>{ch.title}</h2>
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
        {!isStoryPlayable(ch) && <p className="gt-bubble">內容準備中</p>}
        {isStoryPlayable(ch) && ch.dialogue.map((entry,index) => { const character = CHARACTERS[entry.character]; const profile = findCharacterProfile(entry.character); const Avatar = profile ? 'button' : 'div'; return <div className="gt-dialogue" key={entry.id} hidden={line < index} style={{ '--gt-character-color': character.color }}>
          <Avatar data-layout-owned="component" className={`gt-avatar${profile ? ' gt-avatar-button' : ''}`} aria-hidden={profile ? undefined : true} aria-label={profile ? `開啟${character.name}的角色檔案` : undefined} type={profile ? 'button' : undefined} onClick={profile ? () => onOpenCharacter(profile.id) : undefined} style={{ background: character.avatar || character.initials ? character.color : 'transparent' }}>{character.avatar ? <img src={character.avatar} alt="" /> : character.initials}</Avatar>
          <div className="gt-dialogue-copy"><h3>{character.name}</h3><p className="gt-bubble">{entry.text}</p></div>
        </div> })}
      </div>)}
      </div>
      <footer><button onClick={last ? onClose : onNext}><Text id="story-next" hidden={last}>NEXT</Text><Text id="story-finish" hidden={!last}>FINISH</Text></button></footer>
    </section>
  </div>
}
