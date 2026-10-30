import { useEffect, useRef } from 'react'
import Text from './Text'
import { BODIES, CONTINENTS, STORY_GROUPS, ALL_CHAPTERS } from './data'
import { SCIENCE_LICENSE_URL } from './celestialData'

const ENTRIES = [...BODIES, ...CONTINENTS]
function ScienceIntroduction({ entry, active }) {
  // Separate science IDs prevent saved placeholder prose from overriding the
  // reviewed content; existing navigation/story editor IDs remain unchanged.
  const id = `science-20261030-${entry.id}`
  const copyId = `${id}-reference-v3`
  return <section hidden={!active} data-science-entry={entry.id}>
    <Text id={`${id}-name`} as="h2">{entry.displayName}</Text>
    <Text id={`${id}-subtitle`} as="p" className="gt-subtitle">{entry.subtitle}</Text>
    <Text id={`${copyId}-introduction`} as="p">{entry.introduction}</Text>
    <h3>基本數據</h3>
    <dl className="gt-science-facts">
      {entry.facts.map((fact, index) => <div key={fact.label}>
        <Text id={`${copyId}-fact-${index}-label`} as="dt">{fact.label}</Text>
        <Text id={`${copyId}-fact-${index}-value`} as="dd">{fact.value}</Text>
      </div>)}
    </dl>
    {entry.sections.map((section, index) => <section key={section.heading}>
      <Text id={`${copyId}-section-${index}-heading`} as="h3">{section.heading}</Text>
      <Text id={`${copyId}-section-${index}-text`} as="p">{section.text}</Text>
    </section>)}
  </section>
}
function ScienceSources({ entry }) {
  if (!entry) return null
  return <footer className="gt-science-sources" data-dev-text-dynamic data-science-sources={entry.id} aria-label="資料來源">
    {entry.sources.map(source => <div key={source.url}>
      資料來源：{source.author}〈<a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>〉
      <span> · 查閱 <time dateTime={source.accessedAt}>{source.accessedAt}</time></span>
    </div>)}
    <div>以上科普文字經翻譯、整理與簡化，依 <a href={SCIENCE_LICENSE_URL} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> 分享。角色對話另列。</div>
  </footer>
}
export default function ResearchNotes({ selected, continent, onContinent, onChapter, onReset }) {
  const notesRef = useRef(null)
  useEffect(() => { if (notesRef.current) notesRef.current.scrollTop = 0 }, [selected, continent])
  const activeId = selected === 'earth' && continent ? continent : selected
  const activeEntry = ENTRIES.find(entry => entry.id === activeId)
  const chapters = STORY_GROUPS[selected === 'earth' ? continent : 'celestial'] ?? []
  return <aside ref={notesRef} className={`gt-notes${selected ? ' is-open' : ''}`} aria-label="Research notebook" aria-hidden={!selected} inert={!selected}>
    <div className="gt-note-dots" aria-hidden="true" />
    <div className="gt-note-content">
      <header className="gt-note-heading"><Text id="notebook-label">Research notebook</Text><button onClick={onReset}><Text id="reset">Reset view</Text></button></header>
      {ENTRIES.map(entry => <ScienceIntroduction key={entry.id} entry={entry} active={entry.id === activeId} />)}
      <section hidden={selected !== 'earth'}>
        <Text id="continents-heading" as="h3">Field notebooks</Text>
        <div className="gt-continent-list">{CONTINENTS.map(c => <button key={c.id} aria-pressed={continent === c.id} onClick={() => onContinent(c.id)}><Text id={`continent-${c.id}-name`}>{c.name}</Text></button>)}</div>
        {!continent && <Text id="continent-prompt" as="p">Choose a field notebook to read its stories.</Text>}
      </section>
      <Text id="chapters-heading" as="h3">Student stories</Text>
      <div className="gt-chapters">{ALL_CHAPTERS.map(ch => <button hidden={!chapters.includes(ch)} key={ch.id} onClick={() => onChapter(ch.id)}><Text id={`chapter-${ch.id}`}>{ch.title}</Text></button>)}</div>
      <ScienceSources key={activeId} entry={activeEntry} />
    </div>
  </aside>
}
