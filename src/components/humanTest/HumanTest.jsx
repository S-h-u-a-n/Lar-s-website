import NaturalTest from '../naturalTest/NaturalTest'
import { CATEGORIES } from './data'
import Text from './Text'
import HumanCanvas from './HumanCanvas'
import HumanReadingPanel from './HumanReadingPanel'
import './HumanTest.css'
export default function HumanTest({ onBack, entranceReady = true, revealOnMount = true }) {
  return <NaturalTest revealOnMount={revealOnMount} entranceReady={entranceReady} onBack={onBack} categories={CATEGORIES} TextComponent={Text} CanvasComponent={HumanCanvas} PanelComponent={HumanReadingPanel} pageId="human-test" title="HUMAN WORLD" tagline="Civilizations, collected with curiosity" className="human-test" minimumScale={.06}/>
}
