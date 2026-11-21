import { useLayoutEffect, useRef } from 'react'
import Text from './Text'
import ReadingPhoto from '../research/ReadingPhoto'
import solarPhotos from './solarPhotos.json'
import { RESEARCH_PRESENTATION } from '../research/presentationFlags'
import { isStoryPlayable } from './globeContentParser'
import { BODIES, CONTINENTS, STORY_GROUPS, ALL_CHAPTERS } from './data'
import { SCIENCE_LICENSE_URL } from './config'

const ENTRIES = [...BODIES, ...CONTINENTS]
const CONTINENT_NAMES = {
  asia: '亞洲',
  europe: '歐洲',
  africa: '非洲',
  'north-america': '北美洲',
  'south-america': '南美洲',
  oceania: '大洋洲',
  antarctica: '南極洲',
}

function ScienceParagraphs({ text }) {
  return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim()).map((paragraph,index) => <p key={index}>{paragraph}</p>)
}
function ScienceIntroduction({ entry, active, onOpenScale }) {
  return <section hidden={!active} data-science-entry={entry.id} className="gt-science-introduction">
    <div className="gt-title-row"><h2>{entry.displayName}</h2>{solarPhotos[entry.id] && <button className="gt-scale-info" title="查看太陽系比例說明" aria-label="查看太陽系比例說明" aria-haspopup="dialog" onClick={onOpenScale}>ⓘ</button>}</div>
    {entry.subtitle && <p className="gt-subtitle">{entry.subtitle}</p>}
    <ScienceParagraphs text={entry.introduction}/>
    {solarPhotos[entry.id] && <figure className="gt-observation-photo">
      <figcaption><span>OBSERVATION / {String(BODIES.findIndex(body => body.id === entry.id) + 1).padStart(2, '0')}</span><span>觀測影像</span></figcaption>
      <ReadingPhoto content={solarPhotos[entry.id]}/>
    </figure>}
    {entry.facts.length > 0 && <section className="gt-science-facts-panel">
      <h3>基本數據</h3>
      <dl className="gt-science-facts">
        {entry.facts.map(fact => <div key={fact.label}>
          <dt>{fact.label}</dt><dd>{fact.value}</dd>
        </div>)}
      </dl>
    </section>}
    {entry.sections.map(section => <section className="gt-science-section" key={section.heading}>
      <h3>{section.heading}</h3>
      <ScienceParagraphs text={section.text}/>
    </section>)}
    <ScienceSources entry={entry} />
  </section>
}
function ScienceSources({ entry }) {
  if (!entry?.sources.length) return null
  return <details className="gt-science-sources" data-dev-text-dynamic data-science-sources={entry.id}>
    <summary>參考資料</summary>
    <div className="gt-science-sources-content">
      <div className="gt-science-sources-list">
        {entry.sources.map((source, index) => <div key={`${source.url}-${index}`}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
          {source.author && <span> — {source.author}</span>}
          {source.accessedAt && <span> · 查閱 <time dateTime={source.accessedAt}>{source.accessedAt}</time></span>}
        </div>)}
        <div>以上科普文字經翻譯、整理與簡化，依 <a href={SCIENCE_LICENSE_URL} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> 分享。角色對話另列。</div>
      </div>
    </div>
  </details>
}
export default function ResearchNotes({ selected, continent, onContinent, onChapter, onOpenScale }) {
  const notesRef = useRef(null)
  useLayoutEffect(() => { if (notesRef.current) notesRef.current.scrollTop = 0 }, [selected, continent])
  const activeId = selected === 'earth' && continent ? continent : selected
  const chapters = STORY_GROUPS[selected === 'earth' ? continent : 'celestial'] ?? []
  const visibleChapters = chapters.filter(chapter => RESEARCH_PRESENTATION.unfinishedContent || isStoryPlayable(chapter))
  return <aside ref={notesRef} className={`gt-notes${selected ? ' is-open' : ''}`} aria-label="研究筆記" aria-hidden={!selected} inert={!selected}>
    <div className="gt-note-dots" aria-hidden="true" />
    <div className="gt-note-content">
      <header className="gt-note-heading"><Text id="notebook-label">研究筆記</Text></header>
      <section hidden={selected !== 'earth'}>
        <Text id="continents-heading" as="h3">大洲觀測</Text>
        <div className="gt-continent-list">{CONTINENTS.map(c => <button key={c.id} aria-pressed={continent === c.id} onClick={() => onContinent(c.id)}>{CONTINENT_NAMES[c.id] ?? c.name}</button>)}</div>
        {!continent && <Text id="continent-prompt" as="p">選擇一個大洲，閱讀相關故事。</Text>}
      </section>
      {ENTRIES.map(entry => <ScienceIntroduction key={entry.id} entry={entry} active={entry.id === activeId} onOpenScale={onOpenScale} />)}
      {visibleChapters.length > 0 && <section className="gt-stories-section">
        <Text id="chapters-heading" as="h3">學生故事</Text>
        <div className="gt-chapters">{ALL_CHAPTERS.map(ch => <button hidden={!visibleChapters.includes(ch)} key={ch.id} onClick={() => onChapter(ch.id)}>{ch.title}</button>)}</div>
      </section>}
    </div>
  </aside>
}
