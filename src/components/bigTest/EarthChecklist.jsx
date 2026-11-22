import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CHECKLIST_ITEMS, useEarthProgress } from './earthExplorationStore'
import './EarthChecklist.css'

export default function EarthChecklist({ ready, claimWelcome }) {
  // Decide only when the sheet can actually appear. Never mount an optimistic
  // intro while waiting for App's once-per-experience decision.
  const [mode, setMode] = useState(null)
  const welcomeDecided = useRef(false)
  // A returning sheet mounts directly in its pocket, without an entry transition.
  const skipInitialTransition = useRef(false)
  const paper = useRef(null)
  const [showList, setShowList] = useState(false)
  const openList = () => { skipInitialTransition.current = false; setShowList(true); setMode('list') }
  const progress = useEarthProgress()
  const decided = mode !== null
  const expanded = decided && mode !== 'stowed'
  useLayoutEffect(() => {
    if (!ready || welcomeDecided.current) return
    welcomeDecided.current = true
    const firstWelcome = claimWelcome?.() ?? true
    skipInitialTransition.current = !firstWelcome
    setMode(firstWelcome ? 'intro' : 'stowed')
  }, [ready, claimWelcome])
  useLayoutEffect(() => {
    if (!ready || !paper.current) return
    const element = paper.current
    const measure = () => element.style.setProperty('--earth-paper-height', `${element.offsetHeight}px`)
    const observer = new ResizeObserver(measure)
    observer.observe(element); measure()
    return () => observer.disconnect()
  }, [ready, decided])
  useEffect(() => {
    if (!ready || !expanded) return
    const escape = event => { if (event.key === 'Escape') setMode('stowed') }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [ready, expanded])
  if (!ready || !decided) return null
  return <>{expanded && <div className="earth-checklist-backdrop" onClick={() => setMode('stowed')} aria-hidden="true" />}<aside ref={paper} className={`edition-resource-status earth-checklist is-${mode}${showList ? ' has-list' : ''}`} aria-label="地球檢查紙條" style={skipInitialTransition.current ? { transition: 'none' } : undefined} onClick={mode === 'stowed' ? openList : undefined}>
    <button className="earth-checklist-tab" type="button" aria-expanded={expanded} aria-hidden={expanded} tabIndex={expanded ? -1 : 0} onClick={openList} aria-label="展開地球檢查清單" />
    <div className="earth-checklist-body" inert={!expanded}>
      <strong>今天輪到你檢查地球啦！</strong>
      <p>待確認的事項都寫在清單上了！辛苦囉！(o^^o)<span className="earth-checklist-signature">by.拉爾</span></p>
      {showList && <>
        <p className="earth-checklist-count">已查看 {progress.completed.length} / {CHECKLIST_ITEMS.length}</p>
        <ul className="earth-checklist-items" aria-label="探索事項">
          {CHECKLIST_ITEMS.map(item => {
            const done = progress.completed.includes(item.id)
            return <li key={item.id}><span className="earth-checklist-check" role="img" aria-label={done ? '已完成' : '未完成'}>{done ? '☑︎' : '☐'}</span><span>{item.name}</span></li>
          })}
        </ul>
      </>}
      {showList && <button className="earth-checklist-close" type="button" onClick={() => setMode('stowed')}>收起紙條 ↗︎</button>}
    </div>
  </aside></>
}
