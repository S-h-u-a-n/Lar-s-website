import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { patternStyle } from './Background'
import { PANEL_PATTERN, documentPanelTheme } from './config'
import BigMarkdownBody from './BigMarkdownBody'
import DocumentOverlay from './DocumentOverlay'

export default function ResearchLogPanel({ active, onClose, entries }) {
  const [index, setIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const bodyRef = useRef(null)
  const activeIndex = Math.min(index, entries.length - 1)
  const entry = entries[activeIndex]
  const theme = documentPanelTheme('diary')
  const previousAvailable = pageIndex > 0 || activeIndex > 0
  const nextAvailable = pageIndex < entry.pages.length - 1 || activeIndex < entries.length - 1

  useLayoutEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [entry.id, pageIndex, active])

  useEffect(() => {
    if (!active) return
    const previousFocus = document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    const keydown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const buttons = [...panelRef.current.querySelectorAll('button:not(:disabled)')]
      const first = buttons[0], last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', keydown)
    return () => {
      window.removeEventListener('keydown', keydown)
      previousFocus?.focus?.({ preventScroll: true })
    }
  }, [active, onClose])

  const previous = () => {
    if (pageIndex > 0) setPageIndex(current => current - 1)
    else {
      const nextIndex = activeIndex - 1
      setIndex(nextIndex)
      setPageIndex(entries[nextIndex].pages.length - 1)
    }
  }
  const next = () => {
    if (pageIndex < entry.pages.length - 1) setPageIndex(current => current + 1)
    else {
      setIndex(activeIndex + 1)
      setPageIndex(0)
    }
  }

  return <DocumentOverlay id="diary" active={active} onClose={onClose}>
    <div ref={panelRef} className="big-test-document-panel big-test-research-log" role="dialog" aria-modal="true" aria-labelledby="big-test-research-log-title" style={{ '--log-paper': theme.paper, '--log-cover': theme.cover, '--log-dots': theme.dots, '--log-ink': theme.ink }}>
      <div className="big-test-document-cover big-test-research-log-cover">
        <span className="big-test-document-white-square" aria-hidden="true"/>
        <div className="big-test-document-dots" style={patternStyle({ ...PANEL_PATTERN, patternColor: theme.dots })} />
        <span className="big-test-research-log-mark" aria-hidden="true">✦</span>
      </div>
      <div className="big-test-document-copy big-test-research-log-copy">
        <header>
          <h2 id="big-test-research-log-title">{entry.title}</h2>
          {(entry.author || entry.date) && <p className="big-test-research-log-meta">{[entry.author, entry.date].filter(Boolean).join(' · ')}</p>}
        </header>
        <div ref={bodyRef} className="big-test-research-log-body" role="region" aria-label={`${entry.title}日誌內文`} tabIndex={0}>
          <BigMarkdownBody content={entry.pages[pageIndex] ?? ''} />
        </div>
        <footer className="big-test-research-log-footer">
          <button type="button" aria-label="上一頁" disabled={!previousAvailable} onClick={previous}>← 上一頁</button>
          {entry.pages.length > 1 && <span>{pageIndex + 1} / {entry.pages.length}</span>}
          <button type="button" aria-label="下一頁" disabled={!nextAvailable} onClick={next}>下一頁 →</button>
          <button ref={closeRef} type="button" onClick={onClose}>關閉</button>
        </footer>
      </div>
    </div>
  </DocumentOverlay>
}
