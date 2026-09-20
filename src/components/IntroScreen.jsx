import { useEffect, useRef, useState } from 'react'
import './IntroScreen.css'
import GenesisLetters from './GenesisLetters'
import IntroEarth from './IntroEarth'
import IntroSquares from './IntroSquares'

function IntroScreen({ onEnter }) {
  const [isLeaving, setIsLeaving] = useState(false)
  const [genesisReplayKey, setGenesisReplayKey] = useState(0)
  const enterButtonRef = useRef(null)
  const entryTimer = useRef(null)

  useEffect(() => {
    enterButtonRef.current?.focus()
    return () => window.clearTimeout(entryTimer.current)
  }, [])

  function beginEntry() {
    if (isLeaving) return
    setIsLeaving(true)
    entryTimer.current = window.setTimeout(onEnter, 900)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      beginEntry()
    }
  }

  return (
    <div className={`intro-screen${isLeaving ? ' is-leaving' : ''}`}>
      <IntroEarth />
      <IntroSquares leaving={isLeaving} />
      <div className="intro-content">
        <p className="intro-kicker">A story of making worlds</p>
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
          <span>Enter the world</span>
          <span className="intro-enter-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}

export default IntroScreen