import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import useFloatingGeometry from '../globeTest/useFloatingGeometry'
import { CATEGORIES, CHARACTERS, THEME, WORKS } from './data'
import Text from './Text'
import CharacterPortrait from './CharacterPortrait'
const CharacterDevControls = import.meta.env.DEV ? lazy(() => import('./CharacterDevControls')) : null
const showCharacterControls = import.meta.env.DEV
import WorkSelector, { SelectorCredit } from './WorkSelector'
import WorkDialog from './WorkDialog'
import './BallTest.css'
export default function BallTest({ onBack }) {
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id), [selectedIndex, setSelectedIndex] = useState(0), [hoveredId, setHoveredId] = useState(null), [opened, setOpened] = useState(null), [line, setLine] = useState(0)
  const [characterStates, setCharacterStates] = useState({})
  const background = useRef(null)
  useFloatingGeometry(background, 'ball')
  function changeCharacter(id, patch) { setCharacterStates(previous => id === null ? {} : { ...previous, [id]: { ...previous[id], ...patch } }) }
  const category = CATEGORIES.find(item => item.id === categoryId), works = category.works.map(id => WORKS[id]), selected = works[selectedIndex]
  const dialogue = selected.dialogue.length ? selected.dialogue : category.dialogue || []
  const message = dialogue[line], speaker = CHARACTERS.find(character => character.id === message?.speaker)
  useEffect(() => enablePageTextPersistence('ball-test', 'ball-test-'), [])
  const close = useCallback(() => setOpened(null), [])
  function changeCategory(id) { setCategoryId(id); setSelectedIndex(0); setHoveredId(null); setLine(0) }
  function step(direction) { setSelectedIndex(index => (index + direction + works.length) % works.length); setHoveredId(null); setLine(0) }
  return <main className="ball-test" style={{ '--ball-cream': THEME.cream, '--ball-panel': THEME.panel, '--ball-ink': THEME.ink, '--ball-teal': THEME.teal, '--ball-mint': THEME.mint, '--ball-pink': THEME.pink, '--ball-yellow': THEME.yellow, '--ball-blue': THEME.blue, '--ball-duration': `${THEME.motion.duration}ms`, '--ball-ease': THEME.motion.easing }}>
    <div className="ball-page" inert={Boolean(opened)}><div ref={background} className="ball-background" aria-hidden="true"><i data-floating-square="yellow"/><i data-floating-square="stripes"/><i data-floating-square="dots"/><i className="ball-background-mint" data-floating-square="mint"/><i className="ball-background-pink-stripes" data-floating-square="pink-stripes"/><i className="ball-background-blue-grid" data-floating-square="blue-grid"/></div><header className="ball-header"><button className="ball-back" onClick={onBack}><Text id="back">BACK</Text></button><Text as="h1" id="title">OUR FAVORITES!</Text><nav aria-label="作品分類">{CATEGORIES.map(item => <button key={item.id} aria-pressed={item.id === categoryId} onClick={() => changeCategory(item.id)}><Text id={`category-${item.id}`}>{item.name}</Text></button>)}</nav></header>
    <div className="ball-stage">{CHARACTERS.map(character => <CharacterPortrait key={character.id} character={character} body={characterStates[character.id]?.body} face={characterStates[character.id]?.face} talking={message?.speaker === character.id}/>) }<WorkSelector works={works} selectedIndex={selectedIndex} hoveredId={hoveredId} onHover={setHoveredId} onStep={step} onOpen={work=>{setSelectedIndex(works.findIndex(item=>item.id===work.id));setLine(0);setOpened(work)}}/></div>
    <button className="ball-dialogue" data-speaker={speaker?.id} data-dev-text-dynamic onClick={() => setLine(index => Math.min(index + 1, dialogue.length - 1))} aria-label={`${speaker?.name}: ${message?.text}。繼續對話`}><strong className="ball-speaker" key={speaker?.id}>{speaker?.name}</strong><span className="ball-dialogue-message" key={`${selected.id}-${line}`} aria-live="polite">{message?.text}</span>{line < dialogue.length - 1 && <span className="ball-dialogue-next"><Text id="dialogue-next">CLICK TO CONTINUE ▸</Text></span>}</button><SelectorCredit/></div>
    {showCharacterControls && <Suspense fallback={null}><CharacterDevControls characters={CHARACTERS} values={characterStates} onChange={changeCharacter}/></Suspense>}
    <WorkDialog work={opened} onClose={close}/>
  </main>
}
