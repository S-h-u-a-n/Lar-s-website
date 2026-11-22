import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import './styles.css'
import './edition/edition.css'
import './edition/round2.css'

// Development experiments are loaded separately; the normal App stays unchanged.
const experiment = import.meta.env.DEV ? new URLSearchParams(location.search).get('dev') : null
const Entry = lazy(() => experiment === 'ball-intro-test' ? import('./dev/ballIntro/BallIntroTest') : experiment === 'characters' ? import('./dev/characters/CharactersPage') : experiment === 'genesis-cover-test' ? import('./dev/genesisCover/GenesisCoverTest') : import('./App'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}><Entry /></Suspense>
  </StrictMode>,
)
