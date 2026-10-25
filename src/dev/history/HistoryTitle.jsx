import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import GenesisLetters from '../../components/GenesisLetters'
import { HISTORY as C } from './config'
import { createTitleGate, nearViewport } from './titleVisibility'
import './historyTitle.css'

// Reuses the unchanged formal component, including its original spring frames,
// image crops, hover response, timers and replay cleanup. Only activation is gated.
export default forwardRef(function HistoryTitle(_, ref) {
  const [prepared, setPrepared] = useState(false)
  const [started, setStarted] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const gate = useRef(createTitleGate()), preparedRef = useRef(false), fontsReady = useRef(false)
  const lastGeometry = useRef(null)
  const check = useCallback((geometry) => {
    if (!geometry) return
    lastGeometry.current = geometry
    const { rect, viewport } = geometry
    if (!preparedRef.current && nearViewport(rect, viewport, C.titlePlayback.preloadMargin)) {
      preparedRef.current = true; setPrepared(true)
    }
    if (gate.current.check(rect, viewport, fontsReady.current && !document.hidden)) {
      preparedRef.current = true; setPrepared(true); setStarted(true)
    }
  }, [])
  useImperativeHandle(ref, () => ({ check }), [check])
  useEffect(() => {
    let alive = true
    Promise.all([
      document.fonts.load('400 16px "Playfair Display"'),
      document.fonts.load('italic 400 16px "Playfair Display"'),
    ]).catch(() => {}).then(() => { if (alive) { fontsReady.current = true; check(lastGeometry.current) } })
    const visibility = () => { if (!document.hidden) check(lastGeometry.current) }
    document.addEventListener('visibilitychange', visibility)
    return () => { alive = false; document.removeEventListener('visibilitychange', visibility) }
  }, [check])
  return <div className="history-title-playback" data-auto-plays={started ? 1 : 0} data-replays={replayKey} data-prepared={String(prepared)}>
    <h1 aria-label="The Wizard’s GENESIS">
      <span className="history-title-pre">The Wizard’s</span>
      <span className="history-title-mainline">
        {prepared ? <GenesisLetters leaving={!started} replayKey={replayKey}/> : <span className="history-title-placeholder">GENESIS</span>}
      </span>
    </h1>
    <button className="history-title-replay" type="button" aria-label="Replay GENESIS animation" disabled={!started} onClick={() => setReplayKey(key => key + 1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 1 4"/><path d="M20 5v6h-6"/></svg>
    </button>
  </div>
})
