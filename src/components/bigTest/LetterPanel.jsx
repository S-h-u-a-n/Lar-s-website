import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { LETTERS, adjacentLetterIndex } from './letters'
import { patternStyle } from './Background'
import { PANEL_PATTERN, documentPanelTheme } from './config'
import DocumentOverlay from './DocumentOverlay'
import './LetterPanel.css'

export default function LetterPanel({ active, onClose, entries = LETTERS, category = 'letter' }) {
  const [index, setIndex] = useState(0)
  const panelRef = useRef(null)
  const bodyRef = useRef(null)
  const letter = entries[index]
  const artworkId = useId().replace(/:/g, '')
  const titleId = `big-test-document-title-${category}`

  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [letter.id, active])

  useEffect(() => {
    if (!active) return
    const previousFocus = document.activeElement
    bodyRef.current?.focus({ preventScroll: true })
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

  const theme = letter.id === 'royal-orbis-academy' ? letter.theme : documentPanelTheme(letter.id)
  return <DocumentOverlay id={category} active={active} onClose={onClose}>
    <div ref={panelRef} className="big-test-document-panel big-test-letter-panel" role="dialog" aria-modal="true" aria-labelledby={category === 'notes' ? undefined : titleId} aria-label={category === 'notes' ? `天球見聞：${letter.title}` : undefined} style={{ '--letter-paper': theme.paper, '--letter-cover': theme.cover, '--letter-dots': theme.dots, '--letter-ink': theme.ink }} onWheel={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
      <div className="big-test-document-cover big-test-letter-cover">
        <div className="big-test-document-dots" style={patternStyle({ ...PANEL_PATTERN, patternColor: theme.dots })} />
        <svg className="big-test-letter-icon" viewBox="0 0 1000 1000" role="img" aria-label={letter.iconAlt}>
          <defs>
            <filter id={`${artworkId}-outer`} colorInterpolationFilters="sRGB"><feFlood floodColor="#51a8c1" /><feComposite in2="SourceAlpha" operator="in" /></filter>
            <filter id={`${artworkId}-inner`} colorInterpolationFilters="sRGB"><feFlood floodColor="#006c86" /><feComposite in2="SourceAlpha" operator="in" /></filter>
            <clipPath id={`${artworkId}-square`}><rect x="227" y="238.5" width="523" height="523" transform="rotate(-6 488.5 500)" /></clipPath>
          </defs>
          <image href={letter.icon} width="1000" height="1000" filter={`url(#${artworkId}-outer)`} />
          <rect className="big-test-letter-white-square" x="227" y="238.5" width="523" height="523" transform="rotate(-6 488.5 500)" fill="#ffffff" />
          <image href={letter.icon} width="1000" height="1000" filter={`url(#${artworkId}-inner)`} clipPath={`url(#${artworkId}-square)`} />
        </svg>
      </div>
      <div className="big-test-document-copy big-test-letter-copy">
        <header><h2 id={titleId}>{letter.title}</h2><p className="big-test-letter-subtitle" lang="en">{letter.subtitle}</p></header>
        <div ref={bodyRef} className="big-test-letter-body" role="region" aria-label={`${letter.title}信件內文`} tabIndex={0}>
          {letter.body.split('\n\n').map((paragraph, paragraphIndex) => <p key={`${letter.id}-${paragraphIndex}`}>{paragraph}</p>)}
          <p className="big-test-letter-signature">{letter.signature}</p>
        </div>
        <footer className="big-test-letter-footer">
          <nav className="big-test-letter-pagination" aria-label="切換信件">
            <button type="button" aria-label="上一項 Prev" disabled={index === 0} onClick={() => setIndex(current => adjacentLetterIndex(current, -1, entries.length))}><span aria-hidden="true">←</span> Prev</button>
            <button type="button" aria-label="下一項 Next" disabled={index === entries.length - 1} onClick={() => setIndex(current => adjacentLetterIndex(current, 1, entries.length))}>Next <span aria-hidden="true">→</span></button>
          </nav>
        </footer>
      </div>
    </div>
  </DocumentOverlay>
}
