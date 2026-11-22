import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion'
import { LETTERS, LETTER_THEMES } from './letters'
import { patternStyle } from './Background'
import { PANEL_PATTERN, documentPanelTheme } from './config'
import DocumentOverlay from './DocumentOverlay'
import BigMarkdownBody from './BigMarkdownBody'
import LayoutEditor from '../../dev/LayoutEditor'
import defaultLetterArtwork from '../../../Art/Big/Big-leftside/Big-letter3.PNG'
import './LetterPanel.css'

const LETTER_ARTWORK_LAYOUT_CONFIG = {
  'letter-list-big-letter3': { x: 24.35, y: 10.79, width: 49.95, rotation: -76.7, zIndex: 2 },
  'letter-detail-letter-kane': { x: -10.02, y: -7.28, width: 122.7, rotation: -5.82, zIndex: 2 },
  'letter-detail-letter-ruyi': { x: -3.87, y: 3.8, width: 106.85, rotation: 3.95, zIndex: 2 },
  'letter-detail-letter-douglas': { x: -10.7, y: 2.73, width: 120.12, rotation: -4.28, zIndex: 2 },
  'letter-detail-letter-seth': { x: -7.16, y: 0.68, width: 116.81, rotation: 6.32, zIndex: 2 },
  'letter-detail-letter-regina': { x: -9.87, y: -10.18, width: 123.38, rotation: -1.75, zIndex: 2 },
  'letter-detail-letter-dolores': { x: 1.65, y: 5.33, width: 99.45, rotation: 7.07, zIndex: 2 },
  'letter-detail-letter-aespaiae': { x: -15.36, y: -0.5, width: 120.4, rotation: 5.78, zIndex: 2 },
}
const NOTE_ARTWORK_LAYOUT_CONFIG = { x: 14.87, y: 17.13, width: 69.71, rotation: 0.09, zIndex: 2 }

function LetterIllustration({ letter, artworkId }) {
  if (!letter.icon) return <svg className="big-test-letter-icon big-test-envelope-icon" viewBox="0 0 1000 1000" role="img" aria-label="信封">
    <rect x="227" y="300" width="546" height="400" rx="24" fill="#fff" stroke="#006c86" strokeWidth="24" />
    <path d="m244 324 256 205 256-205M244 675l190-166m322 166L566 509" fill="none" stroke="#51a8c1" strokeWidth="24" strokeLinejoin="round" />
  </svg>
  return <svg className="big-test-letter-icon" viewBox="0 0 1000 1000" role="img" aria-label={letter.iconAlt}>
    <defs>
      <filter id={`${artworkId}-outer`} colorInterpolationFilters="sRGB"><feFlood floodColor="#5aa3c1" /><feComposite in2="SourceAlpha" operator="in" /></filter>
      <filter id={`${artworkId}-inner`} colorInterpolationFilters="sRGB"><feFlood floodColor="#5aa3c1" /><feComposite in2="SourceAlpha" operator="in" /></filter>
      <clipPath id={`${artworkId}-square`}><rect x="227" y="238.5" width="523" height="523" transform="rotate(-6 488.5 500)" /></clipPath>
    </defs>
    <image href={letter.icon} width="1000" height="1000" filter={`url(#${artworkId}-outer)`} />
    <image href={letter.icon} width="1000" height="1000" filter={`url(#${artworkId}-inner)`} clipPath={`url(#${artworkId}-square)`} />
  </svg>
}

function LetterArtworkEditor({ letter, isList, category, artworkId, coverRef, active, itemsByKey, setItemsByKey }) {
  const aspectRatio = 1328 / 2106
  const layoutId = isList ? 'big-letter-list-artwork' : `big-${category}-detail-${letter.id}`
  const artworkIdForLayout = isList ? 'letter-list-big-letter3' : `${category}-detail-${letter.id}`
  const layoutConfig = isList ? LETTER_ARTWORK_LAYOUT_CONFIG[artworkIdForLayout] : category === 'notes' ? NOTE_ARTWORK_LAYOUT_CONFIG : LETTER_ARTWORK_LAYOUT_CONFIG[artworkIdForLayout]
  const draftKey = category === 'notes' ? `${layoutId}-config-v1` : layoutConfig ? `${layoutId}-config-v2` : layoutId
  const initialItems = isList
    ? [{ id: artworkIdForLayout, label: '來信清單 · Big-letter3.PNG', ...layoutConfig, ratio: aspectRatio, isNode: true }]
    : [{
        id: artworkIdForLayout,
        label: `${letter.iconAlt || '預設信封圖'} · ${letter.title}`,
        ...(layoutConfig ?? { x: 7, y: 7, width: 86, rotation: 0, zIndex: 2 }),
        ratio: 1, isNode: true,
      }]
  const items = itemsByKey[draftKey] ?? initialItems
  const updateItems = useCallback(nextItems => setItemsByKey(current => ({ ...current, [draftKey]: nextItems })), [draftKey])
  const source = isList ? defaultLetterArtwork : letter.icon

  return <LayoutEditor
    items={items}
    initialItems={initialItems}
    onChange={updateItems}
    containerRef={coverRef}
    layoutId={layoutId}
    draftKey={draftKey}
    editorEnabled={active}
    renderNode={() => isList
      ? <img className="big-test-letter-default-image" src={source} alt="" draggable="false" />
      : <LetterIllustration letter={letter} artworkId={artworkId} />}
  />
}

function LetterArtworkTransition({ letter, isList, category, artworkId, coverRef, active, itemsByKey, setItemsByKey, reducedMotion, duration }) {
  const isPresent = useIsPresent()
  return <motion.div className="big-test-letter-artwork-transition" aria-hidden={!isPresent} inert={!isPresent} initial={reducedMotion ? false : { opacity: 0, x: -8, scale: 0.99 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 8, scale: 0.99 }} transition={{ duration, ease: [.22, .75, .25, 1] }}>
    <LetterArtworkEditor letter={letter} isList={isList} category={category} artworkId={artworkId} coverRef={coverRef} active={active && isPresent} itemsByKey={itemsByKey} setItemsByKey={setItemsByKey} />
  </motion.div>
}

function LetterCopyTransition({ children, reducedMotion, duration }) {
  const isPresent = useIsPresent()
  return <motion.div className="big-test-document-copy big-test-letter-copy" aria-hidden={!isPresent} inert={!isPresent} initial={reducedMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }} transition={{ duration, delay: reducedMotion ? 0 : 0.035, ease: [.22, .75, .25, 1] }}>
    {children}
  </motion.div>
}

export default function LetterPanel({ active, onClose, entries = LETTERS, category = 'letter' }) {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [view, setView] = useState(category === 'letter' ? 'list' : 'detail')
  const [artworkItemsByKey, setArtworkItemsByKey] = useState({})
  const panelRef = useRef(null)
  const coverRef = useRef(null)
  const listRef = useRef(null)
  const bodyRef = useRef(null)
  const setListRef = useCallback(node => {
    if (node || !listRef.current?.isConnected) listRef.current = node
  }, [])
  const setBodyRef = useCallback(node => {
    if (node || !bodyRef.current?.isConnected) bodyRef.current = node
  }, [])
  const activeIndex = Math.min(index, entries.length - 1)
  const letter = entries[activeIndex]
  const isLetterList = category === 'letter' && view === 'list'
  const artworkId = useId().replace(/:/g, '')
  const titleId = `big-test-document-title-${category}`
  const artworkKey = isLetterList ? 'letter-list' : letter.id
  const contentKey = isLetterList ? 'letter-list' : `${letter.id}-${pageIndex}`
  const contentTitleId = `${titleId}-${contentKey}`
  const transitionDuration = reducedMotion ? 0 : 0.3

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
  const copyContent = isLetterList ? <>
    <header><h2 id={contentTitleId}>來信</h2><p className="big-test-letter-subtitle">已發布信件 · {entries.length}</p></header>
    <ul ref={setListRef} className="big-test-letter-list" aria-label="已發布來信">
      {entries.map((entry, entryIndex) => <li key={entry.id}>
        <button type="button" onClick={() => selectLetter(entryIndex)}>
          <span className="big-test-letter-list-title">{entry.title}</span>
          <span className="big-test-letter-list-meta">{[entry.from && `寄件人：${entry.from}`, entry.to && `收件人：${entry.to}`, entry.date].filter(Boolean).join(' · ')}</span>
          <span className="big-test-letter-list-arrow" aria-hidden="true">↗︎</span>
        </button>
      </li>)}
    </ul>
    <footer className="big-test-letter-footer big-test-letter-list-footer">
      <span>{entries.length} 封已發布</span>
      <button type="button" onClick={onClose}>關閉</button>
    </footer>
  </> : <>
    <header><h2 id={category === 'letter' ? contentTitleId : titleId}>{letter.title}</h2>{(letter.subtitle || letter.from || letter.to || letter.date) && <p className="big-test-letter-subtitle">{letter.subtitle || [letter.from && `寄件人：${letter.from}`, letter.to && `收件人：${letter.to}`, letter.date].filter(Boolean).join(' · ')}</p>}</header>
    <div ref={setBodyRef} className="big-test-letter-body" role="region" aria-label={`${letter.title}信件內文`} tabIndex={0}>
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
  </>
  return <DocumentOverlay id={category} active={active} onClose={onClose}>
    <div ref={panelRef} className={`big-test-document-panel big-test-letter-panel${isLetterList ? ' is-letter-list' : ''}${category === 'letter' ? ' has-letter-artwork' : ''}`} role="dialog" aria-modal="true" aria-labelledby={category === 'notes' ? undefined : category === 'letter' ? contentTitleId : titleId} aria-label={category === 'notes' ? `天球見聞：${letter.title}` : undefined} style={{ '--letter-paper': theme.paper, '--letter-cover': theme.cover, '--letter-dots': theme.dots, '--letter-ink': theme.ink }} onWheel={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
      <div ref={coverRef} className="big-test-document-cover big-test-letter-cover">
        <div className="big-test-document-dots" style={patternStyle({ ...PANEL_PATTERN, patternColor: theme.dots })} />
        {isLetterList && <div className="big-test-letter-default-square" aria-hidden="true" />}
        {((category === 'letter' && !isLetterList) || category === 'notes') && letter.icon && <span className="big-test-document-white-square" aria-hidden="true" />}
        {category === 'letter'
          ? <AnimatePresence mode="sync" initial={false}>
            <LetterArtworkTransition key={artworkKey} letter={letter} isList={isLetterList} category={category} artworkId={artworkId} coverRef={coverRef} active={active} itemsByKey={artworkItemsByKey} setItemsByKey={setArtworkItemsByKey} reducedMotion={reducedMotion} duration={transitionDuration} />
          </AnimatePresence>
          : category === 'notes' && letter.icon
            ? <LetterArtworkEditor letter={letter} category={category} artworkId={artworkId} coverRef={coverRef} active={active} itemsByKey={artworkItemsByKey} setItemsByKey={setArtworkItemsByKey} />
            : <LetterIllustration letter={letter} artworkId={artworkId} />}
      </div>
      {category === 'letter' ? <div className="big-test-letter-copy-slot">
        <AnimatePresence mode="sync" initial={false}>
          <LetterCopyTransition key={contentKey} reducedMotion={reducedMotion} duration={transitionDuration}>{copyContent}</LetterCopyTransition>
        </AnimatePresence>
      </div> : <div className="big-test-document-copy big-test-letter-copy">{copyContent}</div>}
    </div>
  </DocumentOverlay>
}
