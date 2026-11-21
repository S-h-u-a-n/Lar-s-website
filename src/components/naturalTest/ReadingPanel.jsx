import { RESEARCH_PRESENTATION } from '../research/presentationFlags'
import ReadingPhoto from '../research/ReadingPhoto'
import ResearchIcon from './ResearchIcon'
import ResearchCategoryCircle from './ResearchCategoryCircle'
import { useEffect, useRef } from 'react'
import { ARTICLES, NOTES } from './data'
import Text from './Text'
import { ArticleBody, ArticleSources } from '../research/ArticleContent'
export default function ReadingPanel({ entry, open, onClose, categoryColor, backgroundKey, onNavigate }) {
  const close = useRef(null), scroll = useRef(null)
  useEffect(() => { if (open) close.current?.focus({ preventScroll: true }) }, [open])
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0 }, [entry?.id])
  const article = entry ? ARTICLES[entry.article] : null, note = entry ? NOTES[entry.note] : null
  return <aside className={`nt-reading ${open ? 'is-open' : ''}`} inert={!open} aria-hidden={!open} aria-labelledby="nt-article-title" role="region">
    {open && <ResearchCategoryCircle key={backgroundKey} color={categoryColor}/>}<div className="nt-reading-dots" aria-hidden="true"/><div className="nt-reading-top"><Text id="field-notes">FIELD NOTES</Text><button ref={close} onClick={onClose}><Text id="close">CLOSE ×</Text></button></div>
    <div className="nt-reading-scroll" ref={scroll}>{article && <div key={entry.id} data-dev-scope={`article-${entry.id}`} className="nt-reading-copy"><span className="nt-page-number">{article.page}</span><div className="nt-article-heading"><span className="nt-article-icon"><ResearchIcon type={entry.icon}/></span><h2 id="nt-article-title" lang="zh-Hant">{article.chineseName}</h2></div><p className="nt-subtitle" lang="en">{article.title}</p><ReadingPhoto key={entry.id} content={article}/><ArticleBody content={article}/>{article.relatedPage && onNavigate && <button className="nt-related-page" onClick={() => onNavigate(article.relatedPage.route)}>{article.relatedPage.label}</button>}{RESEARCH_PRESENTATION.studentNotes && note && <section className="nt-student-note" style={{ background: note.color }}><Text as="h3" id="student-note">A STUDENT'S NOTE</Text><p>{note.text}</p><small>{note.author}</small></section>}<ArticleSources sources={article.sources}/></div>}</div>
  </aside>
}
