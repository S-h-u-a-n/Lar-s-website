import { useEffect, useRef, useState } from 'react'
import { CONTENT, CHARACTERS } from './data'
import Text from './Text'
import { ArticleBody, ArticleSources } from '../research/ArticleContent'
function Story({ chapter }) {
  const [line, setLine] = useState(0)
  const message = chapter.dialogue[line], character = CHARACTERS[message.character]
  return <section className="ht-story"><div key={`speaker-${message.id}`} className="ht-speaker"><span className="ht-avatar" style={{ background: character.color }}>{character.avatar ? <img src={character.avatar} alt=""/> : character.initials}</span><strong>{character.name}</strong></div><div key={message.id} className="ht-message" aria-live="polite">{message.text}</div>{chapter.background && <img src={chapter.background} alt="Story illustration"/>}<p key={`progress-${message.id}`}>{line + 1} / {chapter.dialogue.length}</p><button onClick={() => setLine(line < chapter.dialogue.length - 1 ? line + 1 : 0)}><Text id={line < chapter.dialogue.length - 1 ? 'story-next' : 'story-replay'}>{line < chapter.dialogue.length - 1 ? 'NEXT →' : 'READ AGAIN'}</Text></button>{line === chapter.dialogue.length - 1 && <Text as="p" id="story-end">END OF FIELD CONVERSATION</Text>}</section>
}
export default function HumanReadingPanel({ entry, open, onClose }) {
  const close = useRef(null), scroll = useRef(null)
  useEffect(() => { if (open) close.current?.focus({ preventScroll: true }) }, [open])
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0 }, [entry?.id])
  const content = entry ? CONTENT[entry.content] : null
  return <aside className={`nt-reading ${open ? 'is-open' : ''}`} inert={!open} aria-hidden={!open} aria-labelledby="ht-content-title" role="region"><div className="nt-reading-dots" aria-hidden="true"/><div className="nt-reading-top"><Text id="field-notes">HUMAN FIELD NOTES</Text><button ref={close} onClick={onClose}><Text id="close">CLOSE ×</Text></button></div><div className="nt-reading-scroll" ref={scroll}>{content && <div key={entry.id} data-dev-scope={`article-${entry.id}`} className="nt-reading-copy"><span className="nt-page-number">{entry.type.toUpperCase()}</span><h2 id="ht-content-title" lang="zh-Hant">{content.chineseName}</h2><p className="nt-subtitle" lang="en">{content.title}</p>
    {entry.type === 'article' && content.image && <img src={content.image} alt={content.imageAlt || content.title}/>}
    <ArticleBody content={content}/>
    {entry.type === 'story' && <Story key={entry.id} chapter={content.chapter}/>}
    {entry.type === 'infographic' && <ol className="ht-timeline">{content.steps.map(step => <li key={step.year}><span>{step.year}</span><h3>{step.title}</h3><p>{step.text}</p><div aria-hidden="true"/></li>)}</ol>}
    {entry.type === 'recommendation' && <section className="ht-recommendation"><div className="ht-cover">{content.image ? <img src={content.image} alt={content.work.name}/> : <Text id="cover-placeholder">COVER SPACE</Text>}</div><h3>{content.work.name}</h3><small>{content.work.kind}</small><p>{content.work.description}</p><blockquote>{content.work.recommendation}</blockquote></section>}
    {content.note && <section className="nt-student-note"><Text as="h3" id="student-note">A STUDENT'S NOTE</Text><p>{content.note}</p><small>{content.author}</small></section>}
    <ArticleSources sources={content.sources}/>
  </div>}</div></aside>
}
