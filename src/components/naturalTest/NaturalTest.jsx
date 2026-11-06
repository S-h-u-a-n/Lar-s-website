import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import { CAMERA, CATEGORIES, STYLE } from './data'
import useResearchCamera from './useResearchCamera'
import useResearchEntrance from './useResearchEntrance'
import ResearchCanvas from './ResearchCanvas'
import ReadingPanel from './ReadingPanel'
import Text from './Text'
import BilingualTitle from '../research/BilingualTitle'
import './NaturalTest.css'
export default function NaturalTest({ onBack, categories = CATEGORIES, TextComponent = Text, CanvasComponent = ResearchCanvas, PanelComponent = ReadingPanel, pageId = 'natural-test', title = 'NATURAL WORLD', tagline = 'A student atlas of curious things', className = '', minimumScale = CAMERA.minScale, entranceReady = true, revealOnMount = true }) {
  const Text = TextComponent, ResearchCanvas = CanvasComponent, ReadingPanel = PanelComponent
  const [menu, setMenu] = useState(false), [active, setActive] = useState(null), [lastEntry, setLastEntry] = useState(null)
  const [revealing, setRevealing] = useState(() => revealOnMount && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [backgroundSelection, setBackgroundSelection] = useState(null)
  const activateBackground = useCallback(category => setBackgroundSelection(previous => previous?.category.id === category.id ? previous : { category, revision: (previous?.revision ?? 0) + 1 }), [])
  const readingOpen = useRef(false), pageRef = useRef(null)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => { if (media.matches) setRevealing(false) }
    media.addEventListener('change', finish)
    return () => media.removeEventListener('change', finish)
  }, [])
  const savedView = useRef(null), previousFocus = useRef(null), menuButton = useRef(null)
  const bounds = useMemo(() => { const x = Math.min(...categories.map(c => c.x)), y = Math.min(...categories.map(c => c.y)); return { x, y, width: Math.max(...categories.map(c => c.x + c.width)) - x, height: Math.max(...categories.map(c => c.y + c.height)) - y } }, [categories])
  const camera = useResearchCamera(bounds, minimumScale, pageRef, backgroundSelection?.category)
  const goCategory = useCallback((category, options) => {
    activateBackground(category)
    readingOpen.current = false
    setActive(null)
    setMenu(false)
    const viewport = camera.viewportRef.current
    camera.locate({ x: category.x + category.width / 2, y: category.y + category.height / 2 }, Math.min(CAMERA.categoryScale, (viewport.clientWidth - 60) / category.width, (viewport.clientHeight - 40) / category.height), .5, options)
  }, [activateBackground, camera.locate, camera.viewportRef])
  const entrance = useResearchEntrance(camera, categories[0], entranceReady && !revealing, goCategory)
  useEffect(() => enablePageTextPersistence(pageId, `${pageId}-`), [pageId])
  const focusEntry = useCallback(selection => {
    const viewport = camera.viewportRef.current
    if (!viewport) return
    const panelWidth = Math.min(620, Math.max(320, window.innerWidth * .42))
    const available = Math.max(180, viewport.clientWidth - panelWidth - 30)
    const scale = Math.min(CAMERA.entryScale, available / 430, (viewport.clientHeight - 40) / 280)
    camera.locate({ x: selection.category.x + selection.entry.x + 160, y: selection.category.y + selection.entry.y + 65 }, scale, available / (2 * viewport.clientWidth))
  }, [camera.locate, camera.viewportRef])
  function openEntry(entry, category, element) {
    if (!active) { savedView.current = camera.snapshot(); previousFocus.current = element }
    readingOpen.current = true
    if (backgroundSelection?.category.id !== category.id) activateBackground(category)
    const selection = { entry, category }; setActive(selection); setLastEntry(entry); setMenu(false); focusEntry(selection)
  }
  const close = useCallback(() => {
    if (!readingOpen.current) return
    readingOpen.current = false
    setActive(null)
    if (savedView.current) camera.restore(savedView.current)
    previousFocus.current?.focus({ preventScroll: true })
  }, [camera.restore])
  useEffect(() => {
    if (!active) return
    const resize = () => focusEntry(active)
    const key = event => { if (event.key === 'Escape') close() }
    window.addEventListener('resize', resize); window.addEventListener('keydown', key)
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('keydown', key) }
  }, [active, close, focusEntry])
  function overview() { readingOpen.current = false; setActive(null); setBackgroundSelection(null); setMenu(false); camera.overview() }
  function handleCanvasBlankClick(event) {
    if (!backgroundSelection || readingOpen.current) return
    // Let real controls, topic headings, cards and text own their clicks. The
    // camera's capture handler already suppresses the click following a drag.
    if (event.target.closest('button,a,input,textarea,select,[role="button"],.nt-category-intro,.ht-landmark')) return
    overview()
  }
  return <main ref={pageRef} data-selected-category={backgroundSelection?.category.id} inert={revealing || undefined} onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'nt-page-reveal') setRevealing(false) }} data-research-reveal={revealing ? 'revealing' : 'idle'} data-research-entrance={entrance.phase} onPointerDownCapture={entrance.cancel} onWheelCapture={entrance.cancel} onKeyDownCapture={entrance.cancel} className={`natural-test ${className} ${active ? 'has-reading' : ''} ${revealing ? 'nt-is-revealing' : ''}`} style={{ '--nt-cream': STYLE.cream, '--nt-panel': STYLE.panel, '--nt-ink': STYLE.ink, '--nt-teal': STYLE.teal, '--nt-pink': STYLE.pink, '--nt-blue': STYLE.blue, '--nt-yellow': STYLE.yellow, '--nt-mint': STYLE.mint, '--nt-duration': `${STYLE.motion.duration}ms`, '--nt-easing': STYLE.motion.easing, '--nt-dots-delay': `${STYLE.motion.dotsDelay}ms`, '--nt-text-delay': `${STYLE.motion.textDelay}ms` }}>
    <header className="nt-header"><button className="nt-back" onClick={onBack}><Text id="back">← BACK</Text></button><div className="nt-heading"><Text as="h1" id="title">{title}</Text><Text as="p" id="tagline">{tagline}</Text></div><div className="nt-category-navigation"><button ref={menuButton} aria-expanded={menu} aria-controls="nt-category-menu" onClick={() => setMenu(!menu)}><Text id="categories">CATEGORIES</Text><span aria-hidden="true"> {menu ? '−' : '+'}</span></button><nav id="nt-category-menu" className="nt-category-menu" hidden={!menu} aria-label="Research categories" onKeyDown={event => { if (event.key === 'Escape') { setMenu(false); menuButton.current?.focus() } }}>{categories.map(category => <button key={category.id} aria-pressed={backgroundSelection?.category.id === category.id} style={{ '--nt-category-color': category.color }} onClick={() => goCategory(category)}><BilingualTitle chinese={category.chineseName} english={category.name}/></button>)}</nav></div></header>
    <ResearchCanvas camera={camera} onOpen={openEntry} backgroundSelection={backgroundSelection} onCategoryActivate={goCategory} onBlankClick={handleCanvasBlankClick} detailCategory={backgroundSelection?.category.id}/>
    <footer className="nt-controls"><Text as="p" id="instructions">Drag to explore · Scroll to zoom</Text><div><button onClick={() => camera.zoom(1.25)}><Text id="zoom-in">+ ZOOM IN</Text></button><button onClick={() => camera.zoom(.8)}><Text id="zoom-out">− ZOOM OUT</Text></button><button onClick={overview}><Text id="overview">OVERVIEW</Text></button></div></footer>
    {active && <div className="nt-reading-outside" aria-hidden="true" onPointerDown={event => { event.preventDefault(); event.stopPropagation() }} onClick={event => { event.stopPropagation(); close() }}/>}
    <ReadingPanel entry={lastEntry} open={Boolean(active)} onClose={close} categoryColor={active?.category.color} backgroundKey={backgroundSelection?.revision}/>
  </main>
}
