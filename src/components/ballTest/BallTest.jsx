import { useCallback, useEffect, useState } from 'react'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import { CATEGORIES, CHARACTERS, THEME, WORKS } from './data'
import Text from './Text'
import Live2DSlot from './Live2DSlot'
import WorkSelector from './WorkSelector'
import WorkDialog from './WorkDialog'
import './BallTest.css'
export default function BallTest({ onBack }) {
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id), [selectedIndex, setSelectedIndex] = useState(0), [hoveredId, setHoveredId] = useState(null), [opened, setOpened] = useState(null), [line, setLine] = useState(0)
  const category = CATEGORIES.find(item => item.id === categoryId), works = category.works.map(id => WORKS[id]), selected = works[selectedIndex]
  const dialogue = selected.dialogue.length ? selected.dialogue : category.dialogue || []
  const message = dialogue[line], speaker = CHARACTERS.find(character => character.id === message?.speaker)
  useEffect(() => enablePageTextPersistence('ball-test', 'ball-test-'), [])
  const close = useCallback(() => setOpened(null), [])
  function changeCategory(id) { setCategoryId(id); setSelectedIndex(0); setHoveredId(null); setLine(0) }
  function step(direction) { setSelectedIndex(index => (index + direction + works.length) % works.length); setHoveredId(null); setLine(0) }
  return <main className="ball-test" style={{ '--ball-cream': THEME.cream, '--ball-panel': THEME.panel, '--ball-ink': THEME.ink, '--ball-teal': THEME.teal, '--ball-mint': THEME.mint, '--ball-pink': THEME.pink, '--ball-yellow': THEME.yellow, '--ball-blue': THEME.blue, '--ball-duration': `${THEME.motion.duration}ms`, '--ball-ease': THEME.motion.easing }}>
    <div className="ball-page" inert={Boolean(opened)}><div className="ball-background" aria-hidden="true"><i/><i/><i/></div><header className="ball-header"><button onClick={onBack}><Text id="back">← BACK</Text></button><Text as="h1" id="title">OUR FAVORITES!</Text><nav aria-label="Work categories">{CATEGORIES.map(item => <button key={item.id} aria-pressed={item.id === categoryId} onClick={() => changeCategory(item.id)}><Text id={`category-${item.id}`}>{item.name}</Text></button>)}</nav></header>
    <div className="ball-stage">{CHARACTERS.map(character => <Live2DSlot key={character.id} character={character} state={{ idle: message?.speaker !== character.id, talking: message?.speaker === character.id, expression: message?.speaker === character.id ? message.expression : null, motion: message?.speaker === character.id ? message.motion : null }}/>) }<WorkSelector works={works} selectedIndex={selectedIndex} hoveredId={hoveredId} onHover={setHoveredId} onStep={step} onOpen={work=>{setSelectedIndex(works.findIndex(item=>item.id===work.id));setLine(0);setOpened(work)}}/></div>
    <button className="ball-dialogue" onClick={() => setLine(index => Math.min(index + 1, dialogue.length - 1))} aria-label={`${speaker?.name}: ${message?.text}. Continue conversation`}><strong className="ball-speaker">{speaker?.name}</strong><span className="ball-dialogue-message" key={`${selected.id}-${line}`} aria-live="polite">{message?.text}</span><span className="ball-dialogue-next"><Text id={line < dialogue.length - 1 ? 'dialogue-next' : 'dialogue-end'}>{line < dialogue.length - 1 ? 'CLICK TO CONTINUE ▸' : 'END OF CONVERSATION'}</Text></span></button></div>
    <WorkDialog work={opened} onClose={close}/>
  </main>
}
