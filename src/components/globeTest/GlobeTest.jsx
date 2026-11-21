import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import GlobeViewer from '../GlobeViewer'
import '../GlobePage.css'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import Text from './Text'
import ResearchNotes from './ResearchNotes'
import SolarScaleDialog from './SolarScaleDialog'
import { claimSolarIntroduction } from './solarIntroduction'
import StoryDialog from './StoryDialog'
import BodyDots from './BodyDots'
import FloatingGeometry from './FloatingGeometry'
import { BODIES, ALL_CHAPTERS, PALETTE, MOTION_SETTINGS } from './data'
import { charactersWithProfiles } from '../../dev/characters/characters'
import CharacterFile from '../../dev/characters/CharacterFile'
import '../../dev/characters/characters.css'
import './GlobeTest.css'
import './SolarObservation.css'

export default function GlobeTest({ onBack, onModelReady, onModelError, animateEntrance = false }) {
  const [selected,setSelected] = useState(null)
  const [continent,setContinent] = useState(null)
  const [chapterId,setChapterId] = useState(null)
  const [line,setLine] = useState(0)
  const [characterId,setCharacterId] = useState(null)
  const [ready,setReady] = useState(false)
  const [entrySettled,setEntrySettled] = useState(false)
  const [scaleOpen, setScaleOpen] = useState(false)
  useEffect(() => { if (claimSolarIntroduction()) setScaleOpen(true) }, [])
  const commands = useRef(null)
  useEffect(() => enablePageTextPersistence('globe-test','globe-test-'), [])
  const onReady = useCallback(api => {
    commands.current = api
    setReady(Boolean(api))
    setEntrySettled(true)
    if (api) onModelReady?.()
  }, [onModelReady])
  const onError = useCallback(error => {
    setEntrySettled(true)
    onModelError?.(error)
  }, [onModelError])
  const select = useCallback(id => { setSelected(id); setContinent(null); setChapterId(null); setLine(0) }, [])
  const selectContinent = useCallback(id => { setSelected('earth'); setContinent(id); setChapterId(null); setLine(0) }, [])
  const closeStory = useCallback(() => setChapterId(null), [])
  const reset = () => commands.current?.reset()
  const chapter = ALL_CHAPTERS.find(c => c.id === chapterId)
  return <main className={`gt-page${animateEntrance ? ' gt-page--soft-entry' : ''}`} data-entry-ready={entrySettled} style={{ ...Object.fromEntries(Object.entries(PALETTE).map(([key,value]) => [`--gt-${key}`,value])), '--gt-panel-duration': `${MOTION_SETTINGS.panel}ms`, '--gt-dots-delay': `${MOTION_SETTINGS.dotsDelay}ms`, '--gt-text-delay': `${MOTION_SETTINGS.textDelay}ms`, '--gt-easing': MOTION_SETTINGS.easing, '--gt-story-duration': `${MOTION_SETTINGS.story}ms` }}>
    <FloatingGeometry />
    <section className="gt-model" aria-label="Celestial model"><GlobeViewer transparent onReady={onReady} onError={onError} onSelectionChange={select} onContinentSelect={selectContinent} interactionDisabled={Boolean(chapterId)} /></section>
    <header className="gt-header">
      <nav aria-label="頁面導覽">
        <button className="edition-back-button" type="button" onClick={onBack}>BACK</button>
      </nav>
      <Text id="observation-title" as="h1">天體觀測</Text>
      <Text id="subtitle" as="p">A student observatory</Text>
    </header>
    <nav className="gt-body-picker" aria-label="Celestial selection">
      <Text id="picker-label">Observe</Text>
      <select disabled={!ready} value={selected ?? ''} onChange={event => event.target.value ? commands.current?.select(event.target.value) : reset()} aria-label="Choose a celestial body">
        <Text as="option" value="" id="whole-model">Whole model</Text>
        {BODIES.map(body => <option key={body.id} value={body.id}>{body.name}</option>)}
      </select>
      <button disabled={!ready} onClick={reset}><Text id="reset-toolbar">Reset view</Text></button>
    </nav>
    {!selected&&<aside className="edition-observation-invitation">
      <p className="edition-kicker">OBSERVATION / 01</p>
      <div className="edition-star-chart" aria-hidden="true"><i/><i/><i/><span>✧</span></div>
      <h2 className="gt-invitation-title"><span>相對於天球的</span><em>地球</em></h2>
      <p className="gt-invitation-subtitle">沒有魔法也超級精彩的世界！</p>
      <p className="gt-instructions">拖曳模型可以旋轉視角。<br/>點擊天體可以查看相關資料</p>
      <BodyDots ready={ready} selected={selected} onSelect={id => commands.current?.select(id)} />
    </aside>}
    <ResearchNotes onOpenScale={() => setScaleOpen(true)} selected={selected} continent={continent} onContinent={selectContinent} onChapter={id => { setLine(0); setChapterId(id) }} />
    <AnimatePresence>{scaleOpen && <SolarScaleDialog key="solar-scale" onClose={() => setScaleOpen(false)}/>}</AnimatePresence>
    <StoryDialog chapterId={chapterId} line={line} onNext={() => setLine(current => Math.min(current + 1,(chapter?.dialogue.length ?? 1)-1))} onClose={closeStory} onOpenCharacter={setCharacterId} />
    {characterId && <CharacterFile character={charactersWithProfiles.find(character => character.id === characterId)} characters={charactersWithProfiles} onSelect={setCharacterId} onClose={() => setCharacterId(null)} />}
  </main>
}
