import AtlasLabels from '../../edition/AtlasLabels'
import { CAMERA } from '../naturalTest/data'
import { CATEGORIES, entryById } from './data'
import Text from './Text'
const paths = {
  architecture: 'M10 90V40H90V90M5 40L50 10L95 40ZM25 45V85M50 45V85M75 45V85M5 90H95',
  pages: 'M10 20Q30 10 50 25Q70 10 90 20V85Q70 75 50 90Q30 75 10 85ZM50 25V90M20 35L40 38M60 38L80 35M20 50L40 53M60 53L80 50',
  city: 'M5 90V50H25V90M30 90V15H55V90M60 90V35H80V90M85 90V60H98V90M35 30H50M35 45H50M65 50H75',
  circuit: 'M5 20H35V50H65V80H95M5 80H20V60H50V20H95M65 50V10M35 50V95',
  map: 'M10 20L35 10L60 25L90 15V80L65 90L35 75L10 85ZM35 10V75M60 25L65 90M15 55Q40 30 55 50T85 45',
}
function Icon({ kind }) { return <svg viewBox="0 0 100 100" aria-hidden="true"><path d={paths[kind]}/></svg> }
export default function HumanCanvas({ camera, onOpen }) {
  return <div className="nt-viewport" ref={camera.viewportRef} {...camera.handlers} aria-label="Human World research canvas"><div className={`nt-world nt-level-${camera.level}`} ref={camera.worldRef}>{CATEGORIES.map((category, index) => <section key={category.id} className={`nt-category ht-${category.decoration}`} style={{ left: category.x, top: category.y, width: category.width, height: category.height, '--nt-category-color': category.color, '--nt-order': index }}>
    <div className="ht-landmark" aria-hidden="true">{category.landmark}</div><div className="ht-diagram" aria-hidden="true"><Icon kind={category.decoration}/></div><div className="ht-pattern" aria-hidden="true"/>
    <button className="nt-category-title" onClick={() => camera.locate({ x: category.x + category.width / 2, y: category.y + category.height / 2 }, Math.min(CAMERA.categoryScale, (camera.viewportRef.current.clientWidth - 60) / category.width, (camera.viewportRef.current.clientHeight - 40) / category.height))}><h2>{category.name}</h2></button><p className="nt-category-intro">{category.introduction}</p>
    {category.entries.map((id, order) => { const entry = entryById[id]; return <button key={id} className="nt-entry" style={{ left: entry.x, top: entry.y, '--nt-entry-order': order }} onClick={event => onOpen(entry, category, event.currentTarget)}><span className="nt-entry-icon"><Icon kind={category.decoration}/></span><span className="nt-entry-copy"><strong>{entry.title}</strong><span className="nt-entry-description">{entry.description}</span><span className="nt-entry-detail">{entry.type.toUpperCase()}</span><span className="nt-read"><Text id={`read-${id}`}>READ ↗</Text></span></span></button> })}
  </section>)}</div><AtlasLabels camera={camera} categories={CATEGORIES} onChoose={category=>camera.locate({x:category.x+category.width/2,y:category.y+category.height/2},Math.min(CAMERA.categoryScale,(camera.viewportRef.current.clientWidth-60)/category.width,(camera.viewportRef.current.clientHeight-40)/category.height))}/></div>
}
