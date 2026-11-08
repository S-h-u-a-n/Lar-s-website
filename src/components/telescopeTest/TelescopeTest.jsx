import { useEffect, useRef, useState } from 'react'
import { TelescopeMap } from '../TelescopePage'
import useFloatingGeometry from '../globeTest/useFloatingGeometry'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import Text from './Text'
import YutaLive2D from './YutaLive2D'
import { useLargeFrameTools, useTelescopeSquarePlacement, useLargeFrameDots, useCoordinateClearance } from './telescopePlacement'
import { ANIMATION, COLLECTION_KEY, COLORS } from './data'
import { RANDOM_LOCATIONS, RECOMMENDATIONS, sameObservation, readObservations } from './observations'
import { HOME_SWATCH_COLORS } from './homeSwatchColors'
import useYutaDialogue from './dialogue/useYutaDialogue'
import './TelescopeTest.css'

function TelescopeGeometry() {
  const root = useRef(null)
  useFloatingGeometry(root, 'tt')
  useTelescopeSquarePlacement(root)
  return <div ref={root} className="tt-square-decor" aria-hidden="true">
    <i className="tt-floating-square tt-floating-square--pink" data-floating-square="pink"/>
    <i className="tt-floating-square tt-floating-square--yellow" data-floating-square="yellow"/>
    <i className="tt-floating-square tt-floating-square--blue" data-floating-square="blue"/>
    <i className="tt-floating-square tt-floating-square--stripes" data-floating-square="stripes"/>
    <i className="tt-floating-square tt-floating-square--grid" data-floating-square="grid"/>
    <i className="tt-floating-square tt-floating-square--checker" data-floating-square="checker"/>
    <i className="tt-floating-square tt-floating-square--polka" data-floating-square="polka"/>
  </div>
}

export default function TelescopeTest({ onBack }) {
  const [mode, setMode] = useState('globe')
  const currentMode = useRef('globe')
  const [status, setStatus] = useState('loading')
  const [focusing, setFocusing] = useState(true)
  const [observation, setObservation] = useState({ longitude: 121, latitude: 23.5, zoom: 1, bearing: 0, pitch: 0, roll: 0, mode: 'globe' })
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('recommendations')
  const [initialCollection] = useState(() => readObservations(localStorage, COLLECTION_KEY))
  const [collection, setCollection] = useState(initialCollection.items)
  const [notice, setNotice] = useState('')
  const lastRandom = useRef(null), functionTrigger = useRef(null)
  const [name, setName] = useState('')
  const [storageError, setStorageError] = useState(!initialCollection.readable)
  const dialogue = useYutaDialogue()
  const { introActive, introCompleted } = dialogue
  const yuta = useRef(null), bubble = useRef(null), mentorStage = useRef(null)
  useLargeFrameTools(mentorStage)
  useLargeFrameDots(mentorStage)
  const coordinate = useRef(null)
  useCoordinateClearance(coordinate)
  const dialogueStep = dialogue.segmentKey
  const hasNextDialogue = dialogue.hasNext
  function advanceDialogue(event) {
    const control = event?.target instanceof Element && event.target.closest('[data-dialogue-interactive],a,input,select,textarea')
    if (control && event.currentTarget.contains(control)) return
    dialogue.controller.advance()
  }
  function interactWithYuta(event) {
    if (dialogue.controller.getSnapshot().active) advanceDialogue(event)
    else dialogue.controller.talk()
  }
  useEffect(() => {
    const node = bubble.current
    if (dialogueStep <= 1 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    node.getAnimations({ subtree: true }).forEach(animation => animation.cancel())
    const bounce = node.animate([
      { transform: 'scale(1)' }, { transform: 'scale(1.012,.98)', offset: .3 },
      { transform: 'scale(.996,1.008)', offset: .65 }, { transform: 'scale(1)' },
    ], { duration: 270, easing: 'ease-out' })
    const text = node.querySelector('.tt-dialogue-line:not([hidden])')
    const reveal = text?.animate([{ opacity: .45, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' })
    return () => { bounce.cancel(); reveal?.cancel() }
  }, [dialogueStep])
  const api = useRef(null), attribution = useRef(null), logButton = useRef(null), closeButton = useRef(null), drawer = useRef(null)
  useEffect(() => enablePageTextPersistence('telescope-test', 'telescope-test-'), [])
  useEffect(() => {
    setFocusing(true)
    if (introActive) return
    const timer = setTimeout(() => setFocusing(false), ANIMATION.focusDuration)
    return () => clearTimeout(timer)
  }, [mode, introActive])
  useEffect(() => { if (open) closeButton.current?.focus() }, [open])
  function closeLog() { setOpen(false); (functionTrigger.current || logButton.current)?.focus(); functionTrigger.current = null }
  function openTool(next, event) { dialogue.controller.feature(next === 'collection' ? 'collection' : 'recommendations'); functionTrigger.current = event.currentTarget; setTab(next); setOpen(true) }
  function switchMode(next, announce = true) { if (next !== currentMode.current) { currentMode.current = next; setStatus('loading'); setMode(next); dialogue.controller.modeSwitched(next, { announce }) } }
  function persist(next) {
    if (!initialCollection.readable) { setStorageError(true); return false }
    try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(next)); setCollection(next); setStorageError(false); return true }
    catch { setStorageError(true); return false }
  }
  const currentFavorite = collection.find(item => sameObservation(item, observation))
  function save() {
    const location = api.current?.getLocation()
    if (!location) { setNotice('請等待觀測視角穩定後再收藏。'); return }
    setObservation(location)
    const existing = collection.find(item => sameObservation(item, location))
    if (existing) {
      if (persist(collection.filter(item => !sameObservation(item, location)))) setNotice('已取消目前觀測的收藏。')
      return
    }
    const label = name.trim() || `${location.mode === 'satellite' ? 'VIEW 實景' : 'MAP 地圖'} · ${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
    if (persist([...collection, { ...location, id: crypto.randomUUID(), name: label, savedAt: new Date().toISOString() }])) { setName(''); setNotice('已收藏目前的觀測視角。'); dialogue.controller.favoriteAdded(location) }
  }
  function visit(location) { switchMode(location.mode === 'satellite' ? 'satellite' : 'globe', false); api.current?.goTo(location); setNotice(`正在開啟：${location.name}`); closeLog() }
  function randomLocation() {
    const choices = RANDOM_LOCATIONS.filter(item => item.id !== lastRandom.current)
    const location = choices[Math.floor(Math.random() * choices.length)]
    lastRandom.current = location.id
    const current = api.current?.getLocation() || observation
    api.current?.goTo({ ...location, mode, pitch: current.pitch ?? (mode === 'satellite' ? 70 : 0), bearing: current.bearing ?? 0, roll: current.roll ?? 0 })
    setNotice(`隨機觀測：${location.name}`)
    dialogue.controller.randomObserved()
  }
  const busy = introActive || focusing || status === 'loading'
  const toolLog = Boolean(functionTrigger.current)
  return <main className="telescope-test" data-intro-active={introActive} data-intro-completed={introCompleted} style={{ '--tt-cream': COLORS.cream, '--tt-ink': COLORS.ink, '--tt-teal': COLORS.teal, '--tt-pink': COLORS.pink, '--tt-blue': COLORS.blue, '--tt-yellow': COLORS.yellow, '--tt-duration': `${ANIMATION.duration}ms`, '--tt-easing': ANIMATION.easing }}>
    <div className="tt-background-geometry" aria-hidden="true"><span className="tt-background-grid"/><span className="tt-background-dots"/><span className="tt-background-square-dots"/></div>
    <TelescopeGeometry/>
    <header className="tt-header"><button onClick={onBack}><span aria-hidden="true">← </span><Text id="back">BACK</Text></button><Text as="h1" id="title">TELESCOPE</Text><button ref={logButton} aria-expanded={open} onClick={() => { functionTrigger.current = null; setOpen(!open) }}><Text id="log">LOG</Text><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="6" y="3" width="15" height="18" rx="2"/><path d="M10 3v18M3 7h5M3 12h5M3 17h5M14 8h4M14 12h4"/></svg></button></header>
    <div className="tt-layout"><section className="tt-observation"><div className="tt-window-anchor"><div className={`tt-window ${busy ? 'is-focusing' : ''}`}><TelescopeMap mode={mode} attributionHostRef={attribution} onReady={value => { api.current = value }} onStatus={setStatus} onObservation={setObservation}/><span key={`${mode}-${introActive ? 'intro' : 'ready'}`} className="edition-lens-calibration" aria-hidden="true"/><div className="tt-focus" aria-live="polite"><div className="tt-reticle"/>{busy && <Text id="loading">Focusing the observation window…</Text>}</div></div></div><div className="tt-modes"><button aria-label="MAP" aria-pressed={mode === 'globe'} onClick={() => switchMode('globe')}><Text id="mode-map">MAP</Text></button><button aria-label="VIEW" aria-pressed={mode === 'satellite'} onClick={() => switchMode('satellite')}><Text id="mode-view">VIEW</Text></button></div><div className="tt-map-status" aria-live="polite">{status === 'error' && <Text id="map-error">Some map resources could not load. Check your connection.</Text>}{mode === 'satellite' && <Text id="view-limit">VIEW terrain preview · Street-level imagery is not connected.</Text>}</div><p data-dev-text-dynamic className="tt-observation-notice" role="status">{notice}</p><div ref={attribution} className="tt-attribution"/></section>
    <aside className="tt-mentor">
      <div className="tt-mentor-stage" ref={mentorStage}>
        <nav data-dev-text-dynamic className="tt-observation-tools" aria-label="觀測輔助功能">
      <button className="tt-observation-dot" aria-label="隨機地點觀測 Random Location" title="隨機地點觀測" disabled={busy || !api.current} onClick={randomLocation}><span aria-hidden="true">⤨</span><small>隨機觀測</small></button>
      <button className="tt-observation-dot" aria-label="大家推薦 Recommendations" disabled={introActive} aria-expanded={open && tab === 'recommendations'} aria-controls="tt-observation-log" title="大家推薦" onClick={event => openTool('recommendations', event)}><span aria-hidden="true">⋯</span><small>大家推薦</small></button>
      <button className="tt-observation-dot" aria-label="我的收藏 Favorites" disabled={introActive} aria-expanded={open && tab === 'collection'} aria-controls="tt-observation-log" title="我的收藏" onClick={event => openTool('collection', event)}><span aria-hidden="true">{currentFavorite ? '★' : '☆'}</span><small>我的收藏</small></button>
    </nav>
      <div className="tt-yuta-scene">
        <div className="tt-yuta-large-backdrop" aria-hidden="true"><span className="tt-color-dots" data-anchor="large-backdrop">{HOME_SWATCH_COLORS.map(color => <span className="tt-color-dot-shell" key={color}><i style={{ background: color }}/></span>)}</span></div>
        <div className="tt-yuta-background" aria-hidden="true"><span className="tt-yuta-dots"/></div>
        <YutaLive2D ref={yuta} dialogueMotion={dialogue.segmentMotion} dialogueKey={dialogue.segmentKey} dialogueActive={dialogue.active} interactionKey={dialogue.interaction} onTalk={interactWithYuta}/>
        <span className="tt-yuta-name">✦ Yuta ✦</span>
      </div>
      </div>
      <button type="button" ref={bubble} className="tt-dialogue tt-dialogue-bubble" aria-label="尤塔的對話" aria-disabled={!dialogue.active} data-dialogue-group={dialogue.group ?? 'idle'} data-dialogue-index={dialogue.index ?? ''} onClickCapture={advanceDialogue}>
        <span className="tt-dialogue-copy" aria-live="polite"><span className="tt-dialogue-line" data-segment-id={dialogue.segment.id}>{dialogue.segment.text}</span></span>

        {hasNextDialogue && <span className="tt-dialogue-next" aria-hidden="true">next <span>▹</span></span>}
      </button><div ref={coordinate} className="tt-compass"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path style={{ transform: `rotate(${-observation.bearing}deg)`, transformOrigin: '32px 32px' }} d="M32 10L40 42L32 36L24 42Z"/></svg><Text id="north">N</Text><span>{observation.latitude.toFixed(3)}°, {observation.longitude.toFixed(3)}°</span></div></aside></div>
    <div className={`tt-log-layer ${open ? 'is-open' : ''}${toolLog ? ' is-observation-tool' : ''}`} inert={!open ? true : undefined}><button hidden={toolLog} className="tt-log-scrim" aria-label="Close observation log" onClick={closeLog}/><aside id="tt-observation-log" ref={drawer} className="tt-drawer" role="dialog" aria-modal={!toolLog} aria-label="Observation log" onKeyDown={event => { if (event.key === 'Escape') closeLog(); if (event.key === 'Tab' && !toolLog) { const buttons = [...drawer.current.querySelectorAll('button,input')].filter(element => !element.disabled && element.getClientRects().length); const first = buttons[0], last = buttons.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() } } }}><div className="tt-drawer-title"><Text as="h2" id="log-title">OBSERVATION LOG</Text><button ref={closeButton} onClick={closeLog}><Text id="close">CLOSE</Text></button></div><nav className="tt-tabs"><button aria-pressed={tab === 'collection'} onClick={() => setTab('collection')}><Text id="my-collection-tab">我的收藏</Text></button><button aria-pressed={tab === 'recommendations'} onClick={() => setTab('recommendations')}>大家推薦</button></nav><section hidden={tab !== 'recommendations'}><h3>大家推薦</h3><p>推薦內容尚未完成，之後會在這裡提供。</p>{RECOMMENDATIONS.length > 0 && <p>推薦資料待接入。</p>}</section><section hidden={tab !== 'collection'}><Text as="p" id="storage-notice">Your collection is saved only in this browser.</Text><p data-dev-text-dynamic className="tt-current-view">目前觀測：{observation.mode === 'satellite' ? 'VIEW 實景' : 'MAP 地圖'} · {observation.latitude.toFixed(6)}°, {observation.longitude.toFixed(6)}° · zoom {(observation.zoom ?? 1).toFixed(3)} · 方向 {(observation.bearing ?? 0).toFixed(3)}° · 俯仰 {(observation.pitch ?? 0).toFixed(3)}° · 傾斜 {(observation.roll ?? 0).toFixed(3)}°</p><p data-dev-text-dynamic role="status">{notice}</p><form onSubmit={event => { event.preventDefault(); save() }}><label htmlFor="tt-name"><Text id="location-name">收藏名稱（選填）</Text></label><input id="tt-name" value={name} maxLength={100} onChange={event => setName(event.target.value)} placeholder="留空則使用模式與座標"/><button data-dev-text-dynamic disabled={busy || !api.current || !initialCollection.readable}>{currentFavorite ? '取消目前收藏' : '收藏目前觀測'}</button></form>{storageError && <Text as="p" id="storage-error">無法保存收藏。儲存空間可能受限，或既有收藏格式無法讀取；原資料已保留。</Text>}{!collection.length && <Text as="p" id="empty">Your next discovery belongs here.</Text>}{collection.map(item => <article key={item.id}><h3>{item.name}</h3><p>{item.latitude.toFixed(6)}°, {item.longitude.toFixed(6)}°<br/>{item.mode === 'satellite' ? 'VIEW 實景' : 'MAP 地圖'} · zoom {(item.zoom ?? 12).toFixed(2)} · 方向 {(item.bearing ?? 0).toFixed(3)}° · 俯仰 {(item.pitch ?? (item.mode === 'satellite' ? 70 : 0)).toFixed(3)}° · 傾斜 {(item.roll ?? 0).toFixed(3)}°</p><button onClick={() => visit(item)}><Text id={`saved-${item.id}-view`}>VIEW LOCATION</Text></button><button onClick={() => { if (persist(collection.filter(entry => entry.id !== item.id))) setNotice('已刪除這筆收藏。') }}><Text id={`saved-${item.id}-delete`}>DELETE</Text></button></article>)}</section></aside></div>
  </main>
}
