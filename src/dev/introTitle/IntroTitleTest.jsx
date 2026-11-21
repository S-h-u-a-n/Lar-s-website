import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import App from '../../App'
import './introTitle.css'

const LINES = ['The Wizard’s', 'GENESIS']
const OPTIONS = { A: '字母彈入', B: '中央展開', C: '雙行錯位' }
const ENTER = { A: 1200, B: 1500, C: 1200 }
const EXIT = 800

// React Bits reference: https://reactbits.dev/text-animations/split-text
// Independent implementation using staggered characters and Web Animations.
// No GSAP / ScrollTrigger dependency or shared HistoryTitle playback state.
function TitlePlayback({ variant, onPhase }) {
  const root = useRef(null)
  useLayoutEffect(() => {
    const node = root.current
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const animations = []
    let timer, done = false, alive = true
    const animate = (element, frames, options) => {
      const animation = element.animate(frames, { fill: 'both', ...options })
      animations.push(animation)
      return animation
    }
    const exit = () => {
      if (done || !alive) return
      done = true
      clearTimeout(timer)
      cameraObserver.disconnect()
      // Freeze entrance at its current pose instead of finishing or cancelling it.
      // The existing parent fade then removes the text and haze without a jump.
      animations.forEach(animation => animation.pause())
      onPhase('退場中')
      // Animate the common parent, so the haze can never outlive the text.
      const opacity = getComputedStyle(node).opacity
      const fade = animate(node, [{ opacity }, { opacity: 0 }], { duration: reduce ? 150 : EXIT, easing: 'ease-out' })
      fade.onfinish = () => { if (alive) onPhase('已結束') }
    }
    // Read the existing rendered camera; input without actual travel is ignored.
    // HistoryTest remains the sole owner of horizontal scrolling and its speed.
    const host = document.querySelector('.history-viewport')
    let camera = Number(host?.dataset.camera ?? 1)
    const cameraObserver = new MutationObserver(() => {
      const next = Number(host.dataset.camera)
      if (!Number.isFinite(next)) return
      if (next !== camera) exit()
      camera = next
    })
    if (host) cameraObserver.observe(host, { attributes: true, attributeFilter: ['data-camera'] })
    onPhase('進場中')
    // B fades only the haze on entrance. Its text and ancestors stay opaque;
    // the common parent controls opacity only when exit begins.
    animate(variant === 'B' ? node.querySelector('.intro-title-haze') : node, [{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 150 : variant === 'B' ? ENTER.B : 450, easing: 'ease-out' })
    node.querySelectorAll('.intro-title-line').forEach((line, row) => {
      const letters = [...line.children]
      const center = line.getBoundingClientRect().width / 2
      letters.forEach((letter, index) => {
        const delay = reduce ? 0 : variant === 'B' ? Math.abs(index - (letters.length - 1) / 2) * 38 : index * (row ? 48 : 30) + row * 90
        let frames, easing, duration
        if (variant === 'A') {
          frames = [{ opacity: 0, transform: `translate(${(index % 3 - 1) * 3}px, ${row ? 52 : 34}px) scale(.96)` }, { opacity: 1, transform: 'translate(0, -4px) scale(1)', offset: .72 }, { opacity: 1, transform: 'translate(0, 0) scale(1)' }]
          easing = 'cubic-bezier(.2,.75,.3,1)'; duration = row ? 800 : 740
        } else if (variant === 'B') {
          const offset = (center - letter.offsetLeft - letter.offsetWidth / 2) * .86
          frames = [{ transform: `translateX(${offset}px) scale(.84)` }, { transform: 'translateX(0) scale(1)' }]
          // Keep the existing stagger; spend the extra time moving, not waiting.
          // The outermost letter finishes at 1291 + 209 = 1500ms.
          easing = 'cubic-bezier(.22,.55,.3,1)'; duration = ENTER.B - (LINES[0].length - 1) / 2 * 38
        } else {
          frames = [{ opacity: 0, transform: `translateX(${row ? 100 : -75}px)` }, { opacity: 1, transform: `translateX(${row ? -3 : 2}px)`, offset: .82 }, { opacity: 1, transform: 'translateX(0)' }]
          easing = row ? 'cubic-bezier(.22,.8,.25,1)' : 'cubic-bezier(.12,.7,.28,1)'; duration = row ? 820 : 650
        }
        animate(letter, reduce ? [{ opacity: variant === 'B' ? 1 : 0 }, { opacity: 1 }] : frames, { duration: reduce ? 150 : duration, delay, easing })
      })
    })
    timer = setTimeout(() => {
      onPhase('完整顯示')
    }, reduce ? 150 : ENTER[variant])
    return () => {
      alive = false
      clearTimeout(timer)
      animations.forEach(animation => animation.cancel())
      cameraObserver.disconnect()
    }
  }, [variant, onPhase])
  return <div ref={root} className="intro-title-overlay" data-variant={variant}>
    <div className="intro-title-composition">
      <div className="intro-title-haze" aria-hidden="true" />
      <h1 aria-label="The Wizard’s GENESIS">
        {LINES.map((text, row) => <span className={`intro-title-line intro-title-line-${row}`} aria-hidden="true" key={text}>
          {[...text].map((char, index) => <span key={index}>{char === ' ' ? '\u00a0' : char}</span>)}
        </span>)}
      </h1>
    </div>
  </div>
}

export default function IntroTitleTest() {
  const [variant, setVariant] = useState('C')
  const [run, setRun] = useState(0)
  const [ready, setReady] = useState(false)
  const [intro, setIntro] = useState(true)
  const [phase, setPhase] = useState('等待插畫')
  useEffect(() => {
    const update = () => {
      const host = document.querySelector('.history-viewport')
      const page = document.querySelector('[data-edition-page]')?.dataset.editionPage
      setIntro(page === 'intro')
      if (host?.dataset.ready === 'true' && host.dataset.opening !== 'preparing') setReady(true)
    }
    const observer = new MutationObserver(update)
    observer.observe(document.getElementById('root'), { subtree: true, childList: true, attributes: true, attributeFilter: ['data-ready', 'data-opening', 'data-edition-page'] })
    update()
    return () => observer.disconnect()
  }, [])
  const replay = next => { setVariant(next); setPhase('進場中'); setRun(value => value + 1) }
  return <>
    <App />
    {intro && ready && phase !== '已結束' && <TitlePlayback key={run} variant={variant} onPhase={setPhase} />}
    {intro && <aside className="intro-title-controls" aria-label="標題登場實驗控制">
      <span className="intro-title-caption">TITLE LAB <small role="status">{phase}</small></span>
      <div role="group" aria-label="動畫方案">
        {Object.entries(OPTIONS).map(([key, label]) => <button type="button" key={key} aria-pressed={variant === key} onClick={() => replay(key)}>{key} <span>{label}</span></button>)}
        <button type="button" disabled={!ready} onClick={() => replay(variant)}>↻ 重播</button>
      </div>
    </aside>}
  </>
}
