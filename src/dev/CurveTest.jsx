import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CurveTransition from './CurveTransition'
import './CurveTest.css'

function CurveTest() {
  const [scene, setScene] = useState(0)
  const [phase, setPhase] = useState('ready')
  const [ready, setReady] = useState(true)
  const [covered, setCovered] = useState(false)

  useEffect(() => {
    if (!covered) return undefined

    const timer = window.setTimeout(() => {
      setPhase('enter')
      setCovered(false)
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [covered])

  function handleAnimationComplete() {
    if (phase === 'exit') {
      setScene((currentScene) => (currentScene === 0 ? 1 : 0))
      setReady(false)
      setCovered(true)
      return
    }

    if (phase === 'enter') setReady(true)
  }

  return (
    <main className={`curve-test-scene curve-test-scene--${scene}`}>
      <div className="curve-test-scene__label" aria-live="polite">
        TEST SCENE 0{scene + 1}
      </div>
      <button
        className="curve-test-replay"
        type="button"
        disabled={!ready}
        onClick={() => {
          setReady(false)
          setPhase('exit')
        }}
      >
        Replay transition
      </button>
      <CurveTransition
        phase={phase}
        onAnimationComplete={handleAnimationComplete}
      />
    </main>
  )
}

const root = createRoot(document.getElementById('curve-test-root'))

root.render(
  <StrictMode>
    <CurveTest />
  </StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount())
}