import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import useFloatingGeometry from '../globeTest/useFloatingGeometry'
import { CATEGORIES, CHARACTERS, THEME, WORKS, OPENING_DIALOGUE } from './data'
import Text from './Text'
import CharacterPortrait from './CharacterPortrait'
import CharacterDialogue, { latestCharacterLines } from './CharacterDialogue'
import { dialoguePortraits } from './dialogueCues'
import { createDialogueSession, dialogueSessionReducer, sessionDialogue } from './dialogueSession'
const CharacterDevControls = import.meta.env.DEV ? lazy(() => import('./CharacterDevControls')) : null
const showCharacterControls = import.meta.env.DEV
import WorkSelector, { SelectorCredit } from './WorkSelector'
import WorkDialog from './WorkDialog'
import WorkIndexDialog from './WorkIndexDialog'
import { createWorkNavigation, workNavigationReducer } from './workNavigation'
import './BallTest.css'
export default function BallTest({ onBack }) {
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id), [expandedWorkId, setExpandedWorkId] = useState(null), [opened, setOpened] = useState(null), [indexOpen, setIndexOpen] = useState(false)
  const [navigation, dispatchNavigation] = useReducer(workNavigationReducer, undefined, createWorkNavigation)
  const navigationRef = useRef(navigation)
  function navigate(event) {
    navigationRef.current = workNavigationReducer(navigationRef.current, event)
    dispatchNavigation(event)
    return navigationRef.current
  }
  const [characterStates, setCharacterStates] = useState({})
  const [session, dispatchDialogue] = useReducer(dialogueSessionReducer, undefined, createDialogueSession)
  const background = useRef(null), lastDialogueAdvance = useRef(-Infinity)
  useFloatingGeometry(background, 'ball')
  function changeCharacter(id, patch) { setCharacterStates(previous => id === null ? {} : { ...previous, [id]: { ...previous[id], ...patch } }) }
  const category = CATEGORIES.find(item => item.id === categoryId), works = category.works.map(id => WORKS[id])
  const dialogue = sessionDialogue(session, OPENING_DIALOGUE, WORKS)
  const line = Math.min(session.line, Math.max(0, dialogue.length - 1))
  const poses = useMemo(() => dialoguePortraits(dialogue, line), [dialogue, line])
  const portraitStates = Object.fromEntries(CHARACTERS.map(character => [character.id, { ...poses[character.id], transition: session.done ? 0 : poses[character.id]?.transition ?? 0, ...characterStates[character.id] }]))
  const message = session.done ? null : dialogue[line]
  const characterLines = latestCharacterLines(dialogue, line)
  useEffect(() => enablePageTextPersistence('ball-test', 'ball-test-'), [])
  const close = useCallback(() => setOpened(null), [])
  function collapseOnPageClick(event) {
    if (!expandedWorkId || opened || indexOpen || event.defaultPrevented) return
    // Listen only on the page, not document: dialogs and editor overlays have
    // their own event trees. Check ancestors so images/text inside controls
    // cannot be mistaken for blank space; do not stop their normal events.
    if (event.target.closest?.('.ball-selector, button, a, input, select, textarea, label, summary, [role="button"], [role="link"], [tabindex], [contenteditable]:not([contenteditable="false"])')) return
    // Existing card height animations handle collapse. Navigation and dialogue
    // are deliberately untouched, including the current portrait cue identity.
    setExpandedWorkId(null)
  }
  function changeCategory(id) { lastDialogueAdvance.current = -Infinity; setCategoryId(id); navigate({type:'reset'}); setExpandedWorkId(null); setOpened(null); dispatchDialogue({type:'clear'}) }
  function beginWork(work) {
    lastDialogueAdvance.current = -Infinity
    dispatchDialogue({type:'work',workId:work.id})
    setOpened(null)
    setExpandedWorkId(work.id)
  }
  function selectWork(work) {
    navigate({type:'select',index:works.findIndex(item => item.id === work.id)})
    beginWork(work)
  }
  function openWork(work) {
    if (expandedWorkId === work.id) { setOpened(work); return }
    selectWork(work)
  }
  function advanceDialogue() {
    const now = performance.now()
    if (now - lastDialogueAdvance.current < 180) return
    lastDialogueAdvance.current = now
    dispatchDialogue({type:'advance',length:dialogue.length})
  }
  function step(direction) {
    if (!works.length) return
    const next = navigate({type:'step',direction,length:works.length})
    beginWork(works[next.selectedIndex])
  }
  function selectWindow(index) {
    if (!works[index]) return
    navigate({type:'seek',index})
    beginWork(works[index])
  }
  function selectIndexedWork(work) {
    const targetCategory = CATEGORIES.find(item => item.id === work.category)
    if (!targetCategory) throw new Error(`Unknown category for Ball work "${work.id}": ${work.category}`)
    const targetIndex = targetCategory.works.indexOf(work.id)
    if (targetIndex < 0) throw new Error(`Ball work "${work.id}" is missing from category "${targetCategory.id}"`)
    setCategoryId(targetCategory.id)
    navigate({type:'seek',index:targetIndex})
    beginWork(work)
    setIndexOpen(false)
  }
  return <main className="ball-test" style={{ '--ball-cream': THEME.cream, '--ball-panel': THEME.panel, '--ball-ink': THEME.ink, '--ball-teal': THEME.teal, '--ball-mint': THEME.mint, '--ball-pink': THEME.pink, '--ball-yellow': THEME.yellow, '--ball-blue': THEME.blue, '--ball-duration': `${THEME.motion.duration}ms`, '--ball-ease': THEME.motion.easing }}>
    <div className="ball-page" inert={Boolean(opened || indexOpen)} onClick={collapseOnPageClick}><div ref={background} className="ball-background" aria-hidden="true"><i data-floating-square="yellow"/><i data-floating-square="stripes"/><i data-floating-square="dots"/><i className="ball-background-mint" data-floating-square="mint"/><i className="ball-background-pink-stripes" data-floating-square="pink-stripes"/><i className="ball-background-blue-grid" data-floating-square="blue-grid"/></div><header className="ball-header"><button className="ball-back" onClick={onBack}><Text id="back">BACK</Text></button><Text as="h1" id="title">OUR FAVORITES!</Text><div className="ball-header-tools"><nav aria-label="作品分類">{CATEGORIES.map(item => <button key={item.id} aria-pressed={item.id === categoryId} onClick={() => changeCategory(item.id)}><Text id={`category-${item.id}`}>{item.name}</Text></button>)}</nav><button className="ball-index-trigger" onClick={() => setIndexOpen(true)}>作品索引</button></div></header>
    <div className="ball-stage">{CHARACTERS.map(character => <CharacterPortrait key={character.id} character={character} body={portraitStates[character.id]?.body} face={portraitStates[character.id]?.face} transition={portraitStates[character.id]?.transition ?? 0} cueKey={`${session.revision}:${session.kind ?? 'idle'}:${session.workId ?? 'opening'}:${portraitStates[character.id]?.cueIndex ?? 'idle'}:${portraitStates[character.id]?.revision ?? 0}`} talking={message?.speaker === character.id}/>) }{works.length ? <WorkSelector key={categoryId} works={works} start={navigation.start} direction={navigation.direction} expandedWorkId={expandedWorkId} onStep={step} onSelectWindow={selectWindow} onOpen={openWork}/> : <p className="ball-empty-category"><Text id={`category-empty-${category.id}`}>這個分類的作品正在準備中。</Text></p>}</div>
    {message && CHARACTERS.map(character => characterLines[character.id] && <CharacterDialogue
      key={`${session.revision}:${session.kind}:${session.workId}:${character.id}`}
      character={character} entry={characterLines[character.id]} active={message.speaker === character.id}
      onAdvance={advanceDialogue} action={line < dialogue.length - 1 ? '繼續對話' : '結束對話'}/>) }{works.length>0&&<SelectorCredit/>}</div>
    {showCharacterControls && <Suspense fallback={null}><CharacterDevControls characters={CHARACTERS} values={portraitStates} onChange={changeCharacter}/></Suspense>}
    <WorkIndexDialog open={indexOpen} onClose={() => setIndexOpen(false)} onSelect={selectIndexedWork}/>
    <WorkDialog work={opened} onClose={close}/>
  </main>
}
