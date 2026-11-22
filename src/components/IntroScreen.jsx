import { useEffect, useRef, useState } from 'react'
import './IntroScreen.css'
import GenesisLetters from './GenesisLetters'
import IntroEarth from './IntroEarth'
import IntroSquares from './IntroSquares'

function IntroScreen({ onEnter, onExplore }) {
  const [isLeaving, setIsLeaving] = useState(false)
  const [genesisReplayKey, setGenesisReplayKey] = useState(0)
  const enterButtonRef = useRef(null)

  useEffect(() => { enterButtonRef.current?.focus() }, [])

  function beginEntry() {
    if (isLeaving) return
    setIsLeaving(true)
    onEnter()
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      beginEntry()
    }
  }

  return (
    <div className={`intro-screen${isLeaving ? ' is-transitioning' : ''}`}>
      <div className="edition-intro-orbit"><IntroEarth /><span className="edition-orbit-label">EARTH / AN IMPOSSIBLE LITTLE EXPERIMENT</span></div>
      <IntroSquares leaving={isLeaving} /><div className="edition-intro-top"><span>THE WIZARD’S GENESIS</span><span>CODEX EDITION / 2026</span></div>
      <div className="intro-content">
        <p className="intro-kicker">A FIELD GUIDE TO THE IMPOSSIBLE</p>
        <h1 className="intro-title">
          <span className="intro-title-pre">The Wizard&apos;s</span>
          <GenesisLetters leaving={isLeaving} replayKey={genesisReplayKey} />
          <span className="intro-title-subtitle">魔法師們的創世紀</span>
        </h1>
        <button
          className="intro-replay"
          type="button"
          aria-label="Replay GENESIS animation"
          onClick={() => setGenesisReplayKey(key => key + 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11a8 8 0 1 0 1 4" />
            <path d="M20 5v6h-6" />
          </svg>
        </button>
        <button
          ref={enterButtonRef}
          className="intro-enter"
          type="button"
          onClick={beginEntry}
          onKeyDown={handleKeyDown}
        >
          <span>打開創世故事</span>
          <span className="intro-enter-arrow" aria-hidden="true">→</span>
        </button>
        <button className="edition-intro-shortcut" onClick={onExplore}>直接走進研究室 ↗︎</button>
        <p className="edition-intro-caption">魔法師們創造了一個沒有魔法的世界。<br/>我們邀請你，成為下一位觀測者。</p>
      </div>
      <div className="edition-intro-bottom"><span>NO MAGIC. ENDLESS WONDER.</span><span>移動滑鼠，讓字母說故事。</span></div>
    </div>
  )
}

export default IntroScreen