import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import ComicIntro from './components/ComicIntro'
import IntroScreen from './components/IntroScreen'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import ExploreSection from './components/ExploreSection'
import Footer from './components/Footer'
import BigIntroductionStack from './components/BigIntroductionStack'
import PortalPlaceholderPage from './components/PortalPlaceholderPage'
import CurveTransition from './components/CurveTransition'
import CircularReveal from './components/CircularReveal'
import TComicPage from './components/TComicPage'
import EditionChrome from './edition/EditionChrome'
import useParallax from './edition/useParallax'
import { TOOLS } from './edition/config'
import { PIGMENTS, PAGE_PIGMENTS } from './edition/palette'
import DevEditorLauncher from './dev/DevEditorLauncher'
import TextEditor from './dev/TextEditor'
import TextDraftLayer from './dev/TextDraftLayer'
import { BIG_INTRODUCTION_PAGES } from './components/bigIntroductionPages'
import { getPortalDestination, PORTAL_DESTINATIONS } from './components/portalDestinations'

import { pickReturnTransition, PORTAL_COMICS } from './components/portalComics/config'
import { COMIC_PAGES, PortalPageArrival } from './components/portalComics/ComicPages'

const HOME_FADE_ANIMATION = 'home-page-arrive'
const getTextPageId = screen => screen === 'scene' ? 'big-test' : screen === PORTAL_DESTINATIONS.globe ? 'globe-test' : screen === PORTAL_DESTINATIONS.telescope ? 'telescope-test' : screen
const BallTest = lazy(() => import('./components/ballTest/BallTest'))
const isBallTestSession = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 'ball-test'
const HumanTest = lazy(() => import('./components/humanTest/HumanTest'))
const isHumanTestSession = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 'human-test'
const NaturalTest = lazy(() => import('./components/naturalTest/NaturalTest'))
const isNaturalTestSession = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 'natural-test'
const TelescopeTest = lazy(() => import('./components/telescopeTest/TelescopeTest'))
const isTelescopeTestSession = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 'telescope-test'
const GlobeTest = lazy(() => import('./components/globeTest/GlobeTest'))
const isGlobeTestSession = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 'globe-test'
const BigTest = lazy(() => import('./components/bigTest/BigTest'))
const isBigTestSession = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 'big-test'

const EDITION_ROUTES = { main: 'home', lab: 'scene', globe: 'globe', telescope: 'telescope', natural: 'natural-test', human: 'human-test', favorites: 'ball-test', story: 'comic', 't-comic': 't-comic' }

function App() {
  useParallax()
  const [homeRevealed, setHomeRevealed] = useState(false)
  const [indexSignal, setIndexSignal] = useState(0)
  const [sceneReady,setSceneReady] = useState(false)
  const pendingScreen = useRef('home')
  const visitedRef = useRef([])
  const [screenState, setScreenState] = useState(() => (
    EDITION_ROUTES[new URLSearchParams(window.location.search).get('edition')] || (isBallTestSession ? 'ball-test' : isHumanTestSession ? 'human-test' : isNaturalTestSession ? 'natural-test' : isTelescopeTestSession ? 'telescope-test' : isGlobeTestSession ? 'globe-test' : isBigTestSession ? 'big-test' : import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 't-comic'
      ? 't-comic'
      : 'intro')
  ))
  const [returnedFromEntrance, setReturnedFromEntrance] = useState(null)
  const [activePortalInteractionId, setActivePortalInteractionId] = useState(null)
  const [visitedBigPortals, setVisitedBigPortals] = useState([])
  visitedRef.current = visitedBigPortals
  const [bigIntroductionStack, setBigIntroductionStack] = useState([])
  const [isBigIntroductionOpen, setIsBigIntroductionOpen] = useState(false)
  const [comicHomePhase, setComicHomePhase] = useState('idle')
  const [portalReveal, setPortalReveal] = useState(null)
  const [portalCurve, setPortalCurve] = useState(null)
  const portalCurveRef = useRef(null)
  const transitionTimer = useRef(null)
  const comicHomePhaseRef = useRef('idle')
  const comicHomeLocked = useRef(false)
  const portalRevealLocked = useRef(false)

  useEffect(() => () => window.clearTimeout(transitionTimer.current), [])

  useEffect(() => {
    const config = Object.values(PORTAL_COMICS).find(item => item.screen === (portalReveal?.destination || screenState))
    if (config) { const image = new Image(); image.src = config.icon }
  }, [portalReveal?.destination, screenState])

  function beginComicTransition() {
    if (screenState !== 'intro') return
    setScreenState('transitioning')
    transitionTimer.current = window.setTimeout(() => {
      setScreenState('comic')
    }, 900)
  }

  function beginComicHomeTransition() {
    if (screenState !== 'comic' || comicHomeLocked.current) return
    pendingScreen.current = 'home'
    comicHomeLocked.current = true
    comicHomePhaseRef.current = 'covering'
    setComicHomePhase('covering')
  }

  function handleComicCurveAnimationComplete(completedPhase) {
    if (completedPhase === 'covering' && comicHomePhaseRef.current === 'covering') {
      comicHomePhaseRef.current = 'covered'
      setComicHomePhase('covered')
      setPortalReveal(null)
      portalRevealLocked.current = false
      setIsBigIntroductionOpen(false)
      window.scrollTo({top:0,behavior:'instant'})
      setScreenState(pendingScreen.current)
      return
    }

    if (completedPhase === 'revealing' && comicHomePhaseRef.current === 'revealing') {
      comicHomePhaseRef.current = 'idle'
      comicHomeLocked.current = false
      setComicHomePhase('idle')
    }
  }

  function handleHomeAnimationEnd(event) {
    if (
      event.target !== event.currentTarget
      || event.animationName !== HOME_FADE_ANIMATION
      || comicHomePhaseRef.current !== 'covered'
    ) return

    comicHomePhaseRef.current = 'revealing'
    setComicHomePhase('revealing')
  }

  function beginEditionReveal() {
    if (comicHomePhaseRef.current !== 'covered') return
    comicHomePhaseRef.current = 'revealing'
    setComicHomePhase('revealing')
  }

  useEffect(() => {
    if (comicHomePhase !== 'covered') return
    // Keep the paper curtain closed until the destination DOM has mounted.
    const timer = setTimeout(beginEditionReveal, 180)
    return () => clearTimeout(timer)
  }, [comicHomePhase, screenState])

  function editionNavigate(target) {
    if (comicHomePhaseRef.current !== 'idle' || portalCurveRef.current) return
    setHomeRevealed(true)
    pendingScreen.current = target
    comicHomeLocked.current = true
    comicHomePhaseRef.current = 'covering'
    setComicHomePhase('covering')
    // Discard an old portal only after the universal curtain fully covers it.
  }
  function editionTool(id) {
    if (['scene','big-test'].includes(screenState)) openPortal(id)
    else editionNavigate(TOOLS.find(tool => tool.id === id)?.route || 'scene')
  }

  const isHomeVisible = screenState === 'home'
  const isTComicScreen = screenState === 't-comic'
  const isPortalComicScreen = Boolean(COMIC_PAGES[screenState])
  const devPageId = getTextPageId(screenState)
  const isSceneVisible = screenState === 'scene' || screenState === 'big-test'
  useEffect(()=>{if(!isSceneVisible)setSceneReady(false)},[isSceneVisible])
  const isGlobeVisible = screenState === PORTAL_DESTINATIONS.globe
  const isTelescopeVisible = screenState === PORTAL_DESTINATIONS.telescope
  const isPortalPlaceholderVisible = Object.values(PORTAL_DESTINATIONS).includes(screenState) && !isGlobeVisible && !isTelescopeVisible
  const isGlobeTestVisible = screenState === 'globe-test'
  const isTelescopeTestVisible = screenState === 'telescope-test'
  const isBallTestVisible = screenState === 'ball-test'
  const isHumanTestVisible = screenState === 'human-test'
  const isNaturalTestVisible = screenState === 'natural-test'
  const isPortalPageVisible = isBallTestVisible || isHumanTestVisible || isNaturalTestVisible || isTelescopeTestVisible || isGlobeTestVisible || isGlobeVisible || isTelescopeVisible || isPortalPlaceholderVisible
  const activePortalRevealDestination = portalReveal?.destination || (isTComicScreen || isPortalComicScreen ? screenState : null)

  function enterMainScene(event) {
    event?.preventDefault()
    setScreenState(isBigTestSession ? 'big-test' : 'scene')
  }

  function openPortal(portalId, revealOrigin) {
    const comic = PORTAL_COMICS[portalId]
    const destination = comic && (comic.panels?.length === 0 || visitedRef.current.includes(portalId)) ? comic.destination : comic?.screen || getPortalDestination(portalId)
    if (!destination || portalRevealLocked.current || portalCurveRef.current || comicHomePhaseRef.current !== 'idle') return
    portalRevealLocked.current = true
    setReturnedFromEntrance(null)
    setActivePortalInteractionId(portalId)
    setIsBigIntroductionOpen(false)
    setPortalReveal({
      destination,
      origin: revealOrigin || getViewportCenter(),
    })
  }

  function returnFromPortal(portalId) {
    if (portalCurveRef.current) return
    if ((isPortalPageVisible || isTComicScreen || isPortalComicScreen) && PORTAL_COMICS[portalId]) {
      const next = { portalId, phase: 'covering', returning: true, markVisited: isPortalPageVisible, theme: pickReturnTransition(portalId) }
      portalCurveRef.current = next
      setPortalCurve(next)
      portalRevealLocked.current = true
      return
    }
    completePortalReturn(portalId)
  }

  function completePortalReturn(portalId, markVisited = true) {
    portalRevealLocked.current = false
    setPortalReveal(null)
    setReturnedFromEntrance(portalId)
    if (portalId && markVisited) {
      setVisitedBigPortals(currentPortals => (
        currentPortals.includes(portalId)
          ? currentPortals
          : [...currentPortals, portalId]
      ))
    }
    setActivePortalInteractionId(null)
    setScreenState(isBigTestSession ? 'big-test' : 'scene')
  }

  function openBigIntroduction(interactionId) {
    const existingItem = bigIntroductionStack.find(item => item.interactionId === interactionId)
    let newItem = null

    if (!existingItem) {
      const imageSrc = BIG_INTRODUCTION_PAGES[interactionId]
      if (!imageSrc) return
      newItem = {
        interactionId,
        imageSrc,
        offsetX: Math.random() * 24 - 12,
        offsetY: Math.random() * 20 - 10,
        rotation: Math.random() * 4 - 2,
      }
    }

    setBigIntroductionStack(currentStack => {
      const existingIndex = currentStack.findIndex(item => item.interactionId === interactionId)
      let nextStack
      if (existingIndex >= 0 && existingIndex === currentStack.length - 1) nextStack = currentStack
      else if (existingIndex >= 0) {
        const existingItem = currentStack[existingIndex]
        nextStack = [
          ...currentStack.slice(0, existingIndex),
          ...currentStack.slice(existingIndex + 1),
          existingItem,
        ]
      } else nextStack = newItem ? [...currentStack, newItem] : currentStack
      return nextStack
    })
    setIsBigIntroductionOpen(true)
  }

  function closeBigIntroduction() {
    setIsBigIntroductionOpen(false)
  }

  function hasBigIntroduction(interactionId) {
    return Boolean(BIG_INTRODUCTION_PAGES[interactionId])
  }

  function beginPortalComicTransition(portalId) {
    if (portalCurveRef.current || screenState !== PORTAL_COMICS[portalId]?.screen) return
    const next = { portalId, phase: 'covering' }
    portalCurveRef.current = next
    setPortalCurve(next)
  }

  function handlePortalCurveComplete(phase) {
    const current = portalCurveRef.current
    if (!current || current.phase !== phase) return
    if (phase === 'covering') {
      const next = { ...current, phase: 'covered' }
      portalCurveRef.current = next
      setPortalCurve(next)
      setPortalReveal(null)
      if (current.returning) completePortalReturn(current.portalId, current.markVisited)
      else setScreenState(PORTAL_COMICS[current.portalId].destination)
    } else if (phase === 'revealing') {
      portalCurveRef.current = null
      setPortalCurve(null)
      portalRevealLocked.current = false
    }
  }

  function revealPortalDestination() {
    const current = portalCurveRef.current
    if (current?.phase !== 'covered') return
    const next = { ...current, phase: 'revealing' }
    portalCurveRef.current = next
    setPortalCurve(next)
  }

  function getViewportCenter() {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  }

  function handlePortalRevealComplete() {
    if (!portalRevealLocked.current || !portalReveal) return
    setScreenState(portalReveal.destination)
  }

  function renderPortalDestination(destination) {
    if (destination === 'ball-test') return <BallTest onBack={() => returnFromPortal('ball')} />
    if (destination === 'human-test') return <HumanTest onBack={() => returnFromPortal('book-close1')} />
    if (destination === 'natural-test') return <NaturalTest onBack={() => returnFromPortal('book-open1')} />
    const ComicPage = COMIC_PAGES[destination]
    if (ComicPage) {
      const portalId = Object.keys(PORTAL_COMICS).find(id => PORTAL_COMICS[id].screen === destination)
      return <ComicPage onContinue={() => beginPortalComicTransition(portalId)} onBack={() => returnFromPortal(portalId)} />
    }
    if (destination === 't-comic') return <TComicPage onComplete={() => beginPortalComicTransition('telescope')} onBack={() => returnFromPortal('telescope')} />
    if (destination === PORTAL_DESTINATIONS.globe) {
      return <GlobeTest onBack={() => returnFromPortal('globe')} />
    }
    if (destination === PORTAL_DESTINATIONS.telescope) {
      return <TelescopeTest onBack={() => returnFromPortal('telescope')} />
    }
    return <PortalPlaceholderPage onBack={() => returnFromPortal(destination)} />
  }

  function renderPageEditors() { return null }

  function returnToMainPage() { editionNavigate('home') }


  return (
    <>
      <div className="site-shell codex-edition" data-edition-page={screenState}>
      {activePortalRevealDestination && (
        <CircularReveal
          origin={portalReveal?.origin}
          isRevealing={Boolean(portalReveal) && screenState !== portalReveal.destination}
          onRevealComplete={handlePortalRevealComplete}
        >
          <Suspense fallback={null}>{renderPortalDestination(activePortalRevealDestination)}</Suspense>
          {import.meta.env.DEV && renderPageEditors(getTextPageId(activePortalRevealDestination))}
          {!import.meta.env.DEV && activePortalRevealDestination !== 't-comic' && <TextDraftLayer pageId={getTextPageId(activePortalRevealDestination)} />}
        </CircularReveal>
      )}
      {(screenState === 'intro' || screenState === 'transitioning') && <IntroScreen onEnter={beginComicTransition} onExplore={() => editionNavigate('scene')} />}
      {screenState === 'comic' && <ComicIntro onContinue={beginComicHomeTransition} />}
          {!portalReveal && isPortalPageVisible && <Suspense fallback={null}>
            <PortalPageArrival animate={Boolean(portalCurve) && portalCurve.phase !== 'covering'} onReady={revealPortalDestination}>{renderPortalDestination(screenState === 'globe-test' ? 'globe' : screenState === 'telescope-test' ? 'telescope' : screenState)}</PortalPageArrival>
          </Suspense>}
          {isSceneVisible && <Suspense fallback={null}><PortalPageArrival animate={Boolean(portalCurve) && portalCurve.phase !== 'covering'} onReady={revealPortalDestination}><BigTest onResourceStatus={status=>setSceneReady(status==='ready')} onBack={returnToMainPage} returnedFromEntrance={returnedFromEntrance} onPortalSelect={openPortal} onOpenIntroduction={openBigIntroduction} onCloseIntroduction={closeBigIntroduction} visitedBigPortals={visitedBigPortals} hasBigIntroduction={hasBigIntroduction} /></PortalPageArrival></Suspense>}
      {!isSceneVisible && !isPortalPageVisible && !isTComicScreen && !isPortalComicScreen && <>
        <Header onHome={() => { setHomeRevealed(true); window.scrollTo({top:0,behavior:'smooth'}) }} onExplore={() => editionNavigate('scene')} onStory={() => editionNavigate('comic')} onIndex={() => {setHomeRevealed(true);setIndexSignal(v=>v+1)}} />
        <main
          className={isHomeVisible ? 'home-content is-home-entering' : 'home-content is-waiting'}
          onAnimationEnd={handleHomeAnimationEnd}
        >
          <HeroSection onEnter={() => editionNavigate('scene')} isHomeVisible={isHomeVisible} revealed={homeRevealed} onRevealComplete={() => setHomeRevealed(true)} onTool={editionTool} />
          <ExploreSection onTool={editionTool} />
        </main>
        <Footer textEditable={isHomeVisible} />
      </>}
      </div>
      <div className="orientation-prompt" role="status" aria-live="polite">
        <div className="orientation-prompt__content">
          <div className="orientation-prompt__icon" aria-hidden="true">
            <span className="orientation-prompt__phone" />
            <span className="orientation-prompt__arrow">&#8635;</span>
          </div>
          <p>為獲得最佳觀看體驗，請將裝置旋轉為橫向。</p>
        </div>
      </div>
      {isSceneVisible && (
        <BigIntroductionStack
          stack={bigIntroductionStack}
          isOpen={isBigIntroductionOpen}
        />
      )}
      <CurveTransition
        phase={comicHomePhase}
        theme={{background:PAGE_PIGMENTS[pendingScreen.current] || PIGMENTS.paper,squareColor:PIGMENTS.butter,icon:TOOLS.find(tool=>tool.route===pendingScreen.current)?.icon || TOOLS[0].icon}}
        onAnimationComplete={handleComicCurveAnimationComplete}
      />
      <CurveTransition phase={portalCurve?.phase || 'idle'} theme={portalCurve ? portalCurve.theme || PORTAL_COMICS[portalCurve.portalId] : undefined} onAnimationComplete={handlePortalCurveComplete} />
      {!import.meta.env.DEV && !portalReveal && isPortalPageVisible && <TextDraftLayer pageId={devPageId} />}
      <EditionChrome sceneReady={sceneReady} screen={screenState} onNavigate={editionNavigate} onTool={editionTool} visited={visitedBigPortals} openSignal={indexSignal} paperOpen={isBigIntroductionOpen && isSceneVisible} onClosePaper={() => {closeBigIntroduction(); window.dispatchEvent(new CustomEvent('edition-reset-view'))}} busy={comicHomePhase !== 'idle' || Boolean(portalCurve) || Boolean(portalReveal && screenState !== portalReveal.destination)} />
    </>
  )
}

export default App
