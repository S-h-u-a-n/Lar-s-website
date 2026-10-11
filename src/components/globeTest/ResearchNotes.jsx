import { useEffect, useRef } from 'react'
import Text from './Text'
import { BODIES, CONTINENTS, STORY_GROUPS } from './data'
export default function ResearchNotes({ selected, continent, onContinent, onChapter, onReset }) {
  const notesRef = useRef(null)
  useEffect(() => { if (notesRef.current) notesRef.current.scrollTop = 0 }, [selected])
  const chapters = STORY_GROUPS[selected === 'earth' ? continent : 'celestial'] ?? []
  return <aside ref={notesRef} className={`gt-notes${selected ? ' is-open' : ''}`} aria-label="Research notebook" aria-hidden={!selected} inert={!selected}>
    <div className="gt-note-dots" aria-hidden="true" />
    <div className="gt-note-content">
      <header className="gt-note-heading"><Text id="notebook-label">Research notebook</Text><button onClick={onReset}><Text id="reset">Reset view</Text></button></header>
      {BODIES.map(body => <section key={body.id} hidden={selected !== body.id}>
        <Text id={`body-${body.id}-name`} as="h2">{body.name}</Text>
        <Text id={`body-${body.id}-subtitle`} as="p" className="gt-subtitle">{body.subtitle}</Text>
        <Text id={`body-${body.id}-introduction`} as="p">{body.introduction}</Text>
        <Text id={`body-${body.id}-research`} as="p" className="gt-research">{body.research}</Text>
        {body.illustration && <img className="gt-illustration" src={body.illustration} alt="" />}
        <Text id={`body-${body.id}-annotation`} as="p" className="gt-annotation">{body.annotation}</Text>
      </section>)}
      <section hidden={selected !== 'earth'}>
        <Text id="continents-heading" as="h3">Field notebooks</Text>
        <div className="gt-continent-list">{CONTINENTS.map(c => <button key={c.id} aria-pressed={continent === c.id} onClick={() => onContinent(c.id)}><Text id={`continent-${c.id}-name`}>{c.name}</Text></button>)}</div>
        {CONTINENTS.map(c => <div key={c.id} hidden={continent !== c.id}><Text id={`continent-${c.id}-introduction`} as="p">{c.introduction}</Text></div>)}
        {!continent && <Text id="continent-prompt" as="p">Choose a field notebook to read its stories.</Text>}
      </section>
      <Text id="chapters-heading" as="h3">Student stories</Text>
      <div className="gt-chapters">{Object.values(STORY_GROUPS).flat().map(ch => <button hidden={!chapters.includes(ch)} key={ch.id} onClick={() => onChapter(ch.id)}><Text id={`chapter-${ch.id}`}>{ch.title}</Text></button>)}</div>
    </div>
  </aside>
}
