import { useEffect } from 'react'
import MainScene from '../MainScene'
import TextDraftLayer from '../../dev/TextDraftLayer'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import Background from './Background'
import Documents from './Documents'
import Maintenance from './Maintenance'
import EditableText from './EditableText'
import { MOTION, GEOMETRY } from './config'
import FloatingSquares from './FloatingSquares'
import { getViewportFraming } from './viewportFraming'
import './BigTest.css'

function Navigation({ onBack, showEnterButton, onEnter }) {
  return <div className="big-test-navigation">
    <button type="button" onClick={onBack}><EditableText id="back">Back</EditableText></button>
    <button type="button" onClick={onEnter} hidden={!showEnterButton}><EditableText id="enter">Enter</EditableText></button>
  </div>
}
const navigation = props => <Navigation {...props} />

const syncFocusProgress = (host, progress) => host.style.setProperty('--bt-focus-progress', progress)

export default function BigTest(props) {
  useEffect(() => enablePageTextPersistence('big-test', 'big-test-', { readOnly: !import.meta.env.DEV }), [])
  const titleBar = GEOMETRY.find(shape => shape.id === 'title')
  return <MainScene {...props} viewportAspect={7 / 4} fitViewport={getViewportFraming} onFocusProgress={syncFocusProgress} presentation={<div style={{ '--bt-duration': `${MOTION.duration}ms`, '--bt-easing': MOTION.easing }}>
    <div className="big-test-artboard"><Background /></div>
    <FloatingSquares />
  </div>} navigation={navigation}>
    {!import.meta.env.DEV && <TextDraftLayer pageId="big-test" />}
    <div className="big-test-banner" style={{ backgroundColor: titleBar.color }}>
      <div className="big-test-title-bar" aria-hidden="true" />
      <header className="big-test-title"><button type="button" className="big-test-title-home" onClick={props.onBack} aria-label="返回主頁"><EditableText id="title" as="h1">The Wizard's GENESIS</EditableText></button></header>
    </div>
    <div className="big-test-artboard big-test-interface" style={{ '--bt-duration': `${MOTION.duration}ms`, '--bt-dots-delay': `${MOTION.dotsDelay}ms`, '--bt-text-delay': `${MOTION.textDelay}ms`, '--bt-easing': MOTION.easing }}>
      <Maintenance />
      <Documents onOpen={props.onCloseIntroduction} />
    </div>
  </MainScene>
}
