import ResearchEntranceWash from './ResearchEntranceWash'
import AtlasLabels from '../../edition/AtlasLabels'
import { CAMERA, CATEGORIES, entryById } from './data'
import Text from './Text'
import BilingualTitle from '../research/BilingualTitle'
const paths = {
  mountain: 'M8 52L32 12L56 52ZM23 28L32 36L41 28', fault: 'M5 18H29L22 34H41L34 48H59', waves: 'M4 20Q12 8 20 20T36 20T52 20M4 36Q12 24 20 36T36 36T52 36M4 52Q12 40 20 52T36 52T52 52', drop: 'M32 5C25 18 12 29 12 40A20 20 0 0 0 52 40C52 29 39 18 32 5Z', rays: 'M8 52Q12 8 20 26T32 18T44 30T56 10', cloud: 'M16 46A12 12 0 0 1 16 22A16 16 0 0 1 46 22A12 12 0 1 1 48 46Z', leaf: 'M12 52Q2 10 52 10Q54 56 12 52ZM12 52L40 24', flower: 'M32 20C12 0 0 28 20 32C0 50 28 64 32 44C50 64 64 36 44 32C64 12 36 0 32 20Z', moon: 'M42 8A24 24 0 1 0 56 42A26 26 0 0 1 42 8Z', sun: 'M32 4V12M32 52V60M4 32H12M52 32H60M12 12L18 18M46 46L52 52M12 52L18 46M46 18L52 12',
}
export function ResearchIcon({ type }) { return <svg viewBox="0 0 64 64" aria-hidden="true"><path d={paths[type] || paths.leaf}/>{type === 'sun' && <circle cx="32" cy="32" r="15"/>}</svg> }
export default function ResearchCanvas({ camera, onOpen, washCategory, detailCategory }) {
  return <div className="nt-viewport" ref={camera.viewportRef} {...camera.handlers} aria-label="Natural World research canvas"><div className={`nt-world nt-level-${camera.level}`} ref={camera.worldRef}>
    {CATEGORIES.map((category, index) => <section data-research-category={category.id} data-dev-scope={import.meta.env.DEV ? `category-${category.id}` : undefined} key={category.id} className={`nt-category${detailCategory === category.id ? ' is-entrance-target' : ''}`} style={{ left: category.x, top: category.y, width: category.width, height: category.height, '--nt-category-color': category.color, '--nt-order': index }}>
      {washCategory === category.id && <ResearchEntranceWash/>}
      <div className={`nt-decoration nt-decoration-${category.decoration}`} aria-hidden="true"/>
      <span className="nt-category-number" aria-hidden="true">0{index + 1}</span>
      <button className="nt-category-title" onClick={() => camera.locate({ x: category.x + category.width / 2, y: category.y + category.height / 2 }, Math.min(CAMERA.categoryScale, (camera.viewportRef.current.clientWidth - 60) / category.width, (camera.viewportRef.current.clientHeight - 40) / category.height))}><h2><BilingualTitle chinese={category.chineseName} english={category.name}/></h2></button>
      <p className="nt-category-intro">{category.introduction}</p>
      {category.entries.map((id, entryIndex) => { const entry = entryById[id]; if (!entry) return null; return <button data-dev-scope={import.meta.env.DEV ? `entry-${id}` : undefined} key={id} className="nt-entry" style={{ left: entry.x, top: entry.y, '--nt-entry-order': entryIndex }} onClick={event => onOpen(entry, category, event.currentTarget)}><span className="nt-entry-icon"><ResearchIcon type={entry.icon}/></span><span className="nt-entry-copy"><strong><BilingualTitle chinese={entry.chineseName} english={entry.title}/></strong><span className="nt-entry-description">{entry.description}</span><span className="nt-entry-detail">{entry.detail}</span><span className="nt-read"><Text id={`read-${id}`}>READ ↗</Text></span></span></button> })}
    </section>)}
  </div><AtlasLabels camera={camera} categories={CATEGORIES} onChoose={category=>camera.locate({x:category.x+category.width/2,y:category.y+category.height/2},Math.min(CAMERA.categoryScale,(camera.viewportRef.current.clientWidth-60)/category.width,(camera.viewportRef.current.clientHeight-40)/category.height))}/></div>
}
