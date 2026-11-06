import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import './initialHistoryTitle.css'

// Approved intro-title-test C, independent of the far-left HistoryTitle state.
export default forwardRef(function InitialHistoryTitle(_, ref) {
  const root = useRef(null), engine = useRef(null)
  const [finished, setFinished] = useState(false)
  useImperativeHandle(ref, () => ({ update: snapshot => engine.current?.update(snapshot) }), [])
  useLayoutEffect(() => {
    const node = root.current
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const animations = []
    let started = false, done = false, alive = true, timer
    const animate = (element, frames, options) => {
      const animation = element.animate(frames, { fill: 'both', ...options })
      animations.push(animation)
      return animation
    }
    function start() {
      started = true
      node.style.visibility = 'visible'
      node.dataset.phase = 'entering'
      animate(node, [{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 150 : 450, easing: 'ease-out' })
      node.querySelectorAll('.intro-title-line').forEach((line, row) => {
        const letters = [...line.children]
        letters.forEach((letter, index) => {
          const frames = [{ opacity: 0, transform: `translateX(${row ? 100 : -75}px)` }, { opacity: 1, transform: `translateX(${row ? -3 : 2}px)`, offset: .82 }, { opacity: 1, transform: 'translateX(0)' }]
          animate(letter, reduced ? [{ opacity: 0 }, { opacity: 1 }] : frames, {
            duration: reduced ? 150 : row ? 820 : 650,
            delay: reduced ? 0 : index * (row ? 48 : 30) + row * 90,
            easing: row ? 'cubic-bezier(.22,.8,.25,1)' : 'cubic-bezier(.12,.7,.28,1)',
          })
        })
      })
      timer = setTimeout(() => { if (!done) node.dataset.phase = 'holding' }, reduced ? 150 : 1200)
    }
    function exit() {
      done = true
      clearTimeout(timer)
      animations.forEach(animation => animation.pause())
      node.dataset.phase = 'exiting'
      const fade = animate(node, [{ opacity: getComputedStyle(node).opacity }, { opacity: 0 }], { duration: reduced ? 150 : 800, easing: 'ease-out' })
      fade.onfinish = () => {
        if (!alive) return
        node.style.visibility = 'hidden'
        animations.forEach(animation => animation.cancel())
        setFinished(true)
      }
    }
    engine.current = { update({ ready, camera }) {
      if (done || !ready) return
      if (!started) {
        // A visitor who already moved during image loading has left the intro.
        if (camera !== 1) { done = true; setFinished(true); return }
        start()
      } else if (camera !== 1) exit()
    } }
    return () => {
      alive = false; engine.current = null; clearTimeout(timer)
      animations.forEach(animation => animation.cancel())
    }
  }, [])
  if (finished) return null
  return <div ref={root} className="intro-title-overlay" data-variant="C" data-phase="waiting" style={{ visibility: 'hidden' }}>
    <div className="intro-title-composition">
      <div className="intro-title-haze" aria-hidden="true" />
      <h1 aria-label="The Wizard’s GENESIS">
        {['The Wizard’s', 'GENESIS'].map((text, row) => <span className={`intro-title-line intro-title-line-${row}`} aria-hidden="true" key={text}>
          {[...text].map((char, index) => <span key={index}>{char === ' ' ? '\u00a0' : char}</span>)}
        </span>)}
      </h1>
    </div>
  </div>
})
