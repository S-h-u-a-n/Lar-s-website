import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { LETTERS, LETTER_THEMES } from './letters'
import { patternStyle } from './Background'
import { PANEL_PATTERN, documentPanelTheme } from './config'
import DocumentOverlay from './DocumentOverlay'
import BigMarkdownBody from './BigMarkdownBody'
import './LetterPanel.css'

export default function LetterPanel({ active, onClose, entries = LETTERS, category = 'letter' }) {
  const [index, setIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [view, setView] = useState(category === 'letter' ? 'list' : 'detail')
  const panelRef = useRef(null)
  const listRef = useRef(null)
  const bodyRef = useRef(null)
  const activeIndex = Math.min(index, entries.length - 1)
  const letter = entries[activeIndex]
  const isLetterList = category === 'letter' && view === 'list'
  const artworkId = useId().replace(/:/g, '')
  const titleId = `big-test-document-title-${category}`

  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
    if (listRef.current) listRef.current.scrollTop = 0
  }, [letter.id, pageIndex, active, isLetterList])

  useEffect(() => {
    if (!active) return
    const previousFocus = document.activeElement
    const keydown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const items = [...panelRef.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
      const first = items[0], last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', keydown)
    return () => {
      window.removeEventListener('keydown', keydown)
      previousFocus?.focus?.({ preventScroll: true })
    }
  }, [active, onClose])

  useEffect(() => {
    if (!active) {
      if (category === 'letter') setView('list')
      return
    }
    const target = isLetterList ? listRef.current?.querySelector('button') : bodyRef.current
    target?.focus({ preventScroll: true })
  }, [active, category, index, isLetterList, pageIndex])

  const theme = LETTER_THEMES[letter.theme] ?? documentPanelTheme(letter.id)
  const hasPrevious = pageIndex > 0 || activeIndex > 0
  const hasNext = pageIndex < letter.pages.length - 1 || activeIndex < entries.length - 1
  const selectLetter = nextIndex => {
    setIndex(nextIndex)
    setPageIndex(0)
    setView('detail')
  }
  const previous = () => {
    if (pageIndex > 0) setPageIndex(current => current - 1)
    else { setIndex(activeIndex - 1); setPageIndex(entries[activeIndex - 1].pages.length - 1) }
  }
  const next = () => {
    if (pageIndex < letter.pages.length - 1) setPageIndex(current => current + 1)
    else { setIndex(activeIndex + 1); setPageIndex(0) }
  }
  return <DocumentOverlay id={category} active={active} onClose={onClose}>
    <div ref={panelRef} className="big-test-document-panel big-test-letter-panel" role="dialog" aria-modal="true" aria-labelledby={category === 'notes' ? undefined : titleId} aria-label={category === 'notes' ? `天球見聞：${letter.title}` : undefined} style={{ '--letter-paper': theme.paper, '--letter-cover': theme.cover, '--letter-dots': theme.dots, '--letter-ink': theme.ink }} onWheel={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
      <div className="big-test-document-cover big-test-letter-cover">
        <div className="big-test-document-dots" style={patternStyle({ ...PANEL_PATTERN, patternColor: theme.dots })} />
        {!isLetterList && letter.icon ? <svg className="big-test-letter-icon" viewBox="0 0 1000 1000" role="img" aria-label={letter.iconAlt}>
          <defs>
            <filter id={`${artworkId}-outer`} colorInterpolationFilters="sRGB"><feFlood floodColor="#51a8c1" /><feComposite in2="SourceAlpha" operator="in" /></filter>
            <filter id={`${artworkId}-inner`} colorInterpolationFilters="sRGB"><feFlood floodColor="#006c86" /><feComposite in2="SourceAlpha" operator="in" /></filter>
            <clipPath id={`${artworkId}-square`}><rect x="227" y="238.5" width="523" height="523" transform="rotate(-6 488.5 500)" /></clipPath>
          </defs>
          <image href={letter.icon} width="1000" height="1000" filter={`url(#${artworkId}-outer)`} />
          <rect className="big-test-letter-white-square" x="227" y="238.5" width="523" height="523" transform="rotate(-6 488.5 500)" fill="#ffffff" />
          <image href={letter.icon} width="1000" height="1000" filter={`url(#${artworkId}-inner)`} clipPath={`url(#${artworkId}-square)`} />
        </svg> : <svg className="big-test-letter-icon big-test-envelope-icon" viewBox="0 0 1000 1000" role="img" aria-label="信封">
          <rect x="227" y="300" width="546" height="400" rx="24" fill="#fff" stroke="#006c86" strokeWidth="24" />
          <path d="m244 324 256 205 256-205M244 675l190-166m322 166L566 509" fill="none" stroke="#51a8c1" strokeWidth="24" strokeLinejoin="round" />
        </svg>}
      </div>
      <div className="big-test-document-copy big-test-letter-copy">
        {isLetterList ? <>
        <header><h2 id={titleId}>來信</h2><p className="big-test-letter-subtitle">已發布信件 · {entries.length}</p></header>
        <ul ref={listRef} className="big-test-letter-list" aria-label="已發布來信">
          {entries.map((entry, entryIndex) => <li key={entry.id}>
            <button type="button" onClick={() => selectLetter(entryIndex)}>
              <span className="big-test-letter-list-title">{entry.title}</span>
              <span className="big-test-letter-list-meta">{[entry.from && `寄件人：${entry.from}`, entry.to && `收件人：${entry.to}`, entry.date].filter(Boolean).join(' · ')}</span>
              <span className="big-test-letter-list-arrow" aria-hidden="true">↗</span>
            </button>
          </li>)}
        </ul>
        <footer className="big-test-letter-footer big-test-letter-list-footer">
          <span>{entries.length} 封已發布</span>
          <button type="button" onClick={onClose}>關閉</button>
        </footer>
        </> : <>
        <header><h2 id={titleId}>{letter.title}</h2>{(letter.subtitle || letter.from || letter.to || letter.date) && <p className="big-test-letter-subtitle">{letter.subtitle || [letter.from && `寄件人：${letter.from}`, letter.to && `收件人：${letter.to}`, letter.date].filter(Boolean).join(' · ')}</p>}</header>
        <div ref={bodyRef} className="big-test-letter-body" role="region" aria-label={`${letter.title}信件內文`} tabIndex={0}>
          <BigMarkdownBody content={letter.pages[pageIndex] ?? ''} />
          {letter.signature && <p className="big-test-letter-signature">{letter.signature}</p>}
        </div>
        <footer className="big-test-letter-footer">
          {category === 'letter' ? <nav className="big-test-letter-pagination" aria-label="切換信件">
            <button type="button" aria-label="返回來信列表" onClick={() => setView('list')}>← 列表</button>
            <div className="big-test-letter-stepper">
              <button type="button" aria-label="上一封信" disabled={!hasPrevious} onClick={previous}>←</button>
              <span className="big-test-letter-page-count">{activeIndex + 1} / {entries.length}{letter.pages.length > 1 ? ` · ${pageIndex + 1}/${letter.pages.length}` : ''}</span>
              <button type="button" aria-label="下一封信" disabled={!hasNext} onClick={next}>→</button>
            </div>
            <button type="button" onClick={onClose}>關閉</button>
          </nav> : <nav className="big-test-letter-pagination" aria-label="切換信件">
            <button type="button" aria-label="上一項 Prev" disabled={!hasPrevious} onClick={previous}><span aria-hidden="true">←</span> Prev</button>
            {letter.pages.length > 1 && <span className="big-test-letter-page-count">{pageIndex + 1} / {letter.pages.length}</span>}
            <button type="button" aria-label="下一項 Next" disabled={!hasNext} onClick={next}>Next <span aria-hidden="true">→</span></button>
          </nav>}
        </footer>
        </>}
      </div>
    </div>
  </DocumentOverlay>
}
