import { useCallback, useEffect, useRef, useState } from 'react'
import GlobeViewer from '../GlobeViewer'
import '../GlobePage.css'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import Text from './Text'
import ResearchNotes from './ResearchNotes'
import StoryDialog from './StoryDialog'
import BodyDots from './BodyDots'
import FloatingGeometry from './FloatingGeometry'
import { BODIES, ALL_CHAPTERS, PALETTE, MOTION_SETTINGS } from './data'
import './GlobeTest.css'

export default function GlobeTest({ onBack, onModelReady, onModelError }) {
  const [selected,setSelected] = useState(null)
  const [continent,setContinent] = useState(null)
  const [chapterId,setChapterId] = useState(null)
  const [line,setLine] = useState(0)
  const [ready,setReady] = useState(false)
  const commands = useRef(null)
  useEffect(() => enablePageTextPersistence('globe-test','globe-test-'), [])
  const onReady = useCallback(api => {
    commands.current = api
    setReady(Boolean(api))
    if (api) onModelReady?.()
  }, [onModelReady])
  const select = useCallback(id => { setSelected(id); setContinent(null); setChapterId(null); setLine(0) }, [])
  const selectContinent = useCallback(id => { setSelected('earth'); setContinent(id); setChapterId(null); setLine(0) }, [])
  const closeStory = useCallback(() => setChapterId(null), [])
  const reset = () => commands.current?.reset()
  const chapter = ALL_CHAPTERS.find(c => c.id === chapterId)
  return <main className="gt-page" style={{ ...Object.fromEntries(Object.entries(PALETTE).map(([key,value]) => [`--gt-${key}`,value])), '--gt-panel-duration': `${MOTION_SETTINGS.panel}ms`, '--gt-dots-delay': `${MOTION_SETTINGS.dotsDelay}ms`, '--gt-text-delay': `${MOTION_SETTINGS.textDelay}ms`, '--gt-easing': MOTION_SETTINGS.easing, '--gt-story-duration': `${MOTION_SETTINGS.story}ms` }}>
    <FloatingGeometry />
    <section className="gt-model" aria-label="Celestial model"><GlobeViewer transparent onReady={onReady} onError={onModelError} onSelectionChange={select} onContinentSelect={selectContinent} interactionDisabled={Boolean(chapterId)} /></section>
    <header className="gt-header"><button onClick={onBack}><Text id="back">Back to the laboratory</Text></button><Text id="observation-title" as="h1">天體觀測</Text><Text id="subtitle" as="p">A student observatory</Text></header>
    <nav className="gt-body-picker" aria-label="Celestial selection">
      <Text id="picker-label">Observe</Text>
      <select disabled={!ready} value={selected ?? ''} onChange={event => event.target.value ? commands.current?.select(event.target.value) : reset()} aria-label="Choose a celestial body">
        <Text as="option" value="" id="whole-model">Whole model</Text>
        {BODIES.map(body => <Text as="option" key={body.id} value={body.id} id={`picker-${body.id}`}>{body.name}</Text>)}
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
    <ResearchNotes selected={selected} continent={continent} onContinent={selectContinent} onChapter={id => { setLine(0); setChapterId(id) }} onReset={reset} />
    <StoryDialog chapterId={chapterId} line={line} onNext={() => setLine(current => Math.min(current + 1,(chapter?.dialogue.length ?? 1)-1))} onClose={closeStory} />
  </main>
}
