import { Fragment } from 'react'
import ResearchIcon from './ResearchIcon'
import ResearchCategoryCircle from './ResearchCategoryCircle'
import CategoryDecoration from './CategoryDecoration'
import AtlasLabels from '../../edition/AtlasLabels'
import { CATEGORIES, entryById } from './data'
import Text from './Text'
import BilingualTitle from '../research/BilingualTitle'
export default function ResearchCanvas({ camera, onOpen, backgroundSelection, onCategoryActivate, onBlankClick, detailCategory, readingEntryId }) {
  return <div className="nt-viewport" ref={camera.viewportRef} {...camera.handlers} onClick={onBlankClick} aria-label="Natural World research canvas"><div className={`nt-world nt-level-${camera.level}`} ref={camera.worldRef}>
    {CATEGORIES.map((category, index) => <section data-research-category={category.id} data-expanded={backgroundSelection?.category.id === category.id} data-dev-scope={import.meta.env.DEV ? `category-${category.id}` : undefined} key={category.id} className={`nt-category${detailCategory === category.id ? ' is-entrance-target' : ''}`} style={{ left: category.x, top: category.y, width: category.width, height: category.height, '--nt-category-color': category.color, '--nt-order': index }}>
      {backgroundSelection?.category.id === category.id && <ResearchCategoryCircle key={backgroundSelection.revision}/>}
      <span className="nt-category-number" aria-hidden="true">0{index + 1}</span>
      <button className="nt-category-title" aria-pressed={backgroundSelection?.category.id === category.id} onClick={() => onCategoryActivate(category)}><CategoryDecoration category={category}/><h2><BilingualTitle chinese={category.chineseName} english={category.name}/></h2></button>
      <p className="nt-category-intro">{category.introduction}</p>
      {category.entries.map((id, entryIndex) => { const entry = entryById[id]; if (!entry) return null; return <Fragment key={id}><button data-dev-scope={import.meta.env.DEV ? `entry-${id}` : undefined} key={`${id}-${backgroundSelection?.category.id === category.id ? backgroundSelection.revision : "closed"}`} data-entry-id={id} className={`nt-entry${readingEntryId === id ? ' is-reading-entry' : ''}`} style={{ left: entry.x, top: entry.y, '--nt-entry-order': entryIndex }} onClick={event => onOpen(entry, category, event.currentTarget)}><span className="nt-entry-icon"><ResearchIcon type={entry.icon}/></span><span className="nt-entry-copy"><strong><BilingualTitle chinese={entry.chineseName} english={entry.title}/></strong><span className="nt-entry-description">{entry.description}</span><span className="nt-entry-detail">{entry.detail}</span><span className="nt-read"><Text id={`read-${id}`}>READ ↗︎</Text></span></span></button></Fragment> })}
    </section>)}
  </div><AtlasLabels camera={camera} categories={CATEGORIES} selectedId={backgroundSelection?.category.id} onChoose={onCategoryActivate} renderDecoration={category => <CategoryDecoration category={category} overview/>}/></div>
}
