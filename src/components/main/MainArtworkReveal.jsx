import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import original from '../../../Art/Edition/main-original.jpg'
import attention from '../../../Art/Edition/main-attention.jpg'
import wink from '../../../Art/Edition/main-wink.jpg'
import { MAIN_REVEAL as config, clamp, hash, layoutTiles, measureArtworkFace, selectTarget } from './revealConfig'
import './MainArtworkReveal.css'

const easeOut = t => 1 - (1 - t) ** 3
const easeInOut = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2

export default function MainArtworkReveal({ enabled, onComplete }) {
  const [step, setStep] = useState(0)
  const [removed, setRemoved] = useState([])
  const [phase, setPhase] = useState('ready')
  const [clickId, setClickId] = useState(null)
  const [expression, setExpression] = useState('original')
  const [ready, setReady] = useState(false)
  const [geometry, setGeometry] = useState(null)
  const seed = useRef(null)
  if (seed.current === null) seed.current = Math.floor(Math.random() * 4294967296)
  const colors = useRef(new Map())
  const geometryRef = useRef(null)
  const removedRef = useRef(new Set())
  const phaseRef = useRef('ready')
  const scene = useRef(null), mask = useRef(null)
  const alive = useRef(true), locked = useRef(false)
  const frame = useRef(0), fillFrame = useRef(0)
  const fillValue = useRef(0), finishFill = useRef(null), finishMotion = useRef(null)
  const expressionTimer = useRef(null)
  const animations = useRef(new Set())
  const activeId = geometry ? clickId || selectTarget(geometry, step, removed) : null
  const changePhase = value => { phaseRef.current = value; setPhase(value) }

  useEffect(() => {
    alive.current = true
    let cancelled = false
    Promise.all([original, attention, wink].map(src => {
      const image = new Image(); image.src = src
      return image.decode()
    })).then(() => { if (!cancelled) setReady(true) }).catch(() => { if (!cancelled) setReady(true) })
    return () => {
      cancelled = true; alive.current = false
      clearTimeout(expressionTimer.current)
      cancelAnimationFrame(frame.current); cancelAnimationFrame(fillFrame.current)
      finishFill.current?.(false); finishMotion.current?.(false)
      animations.current.forEach(animation => animation.cancel()); animations.current.clear()
    }
  }, [])

  useLayoutEffect(() => {
    if (!enabled || phase === 'complete') return undefined
    const artwork = document.getElementById('main-artwork')
    const image = artwork?.querySelector('img.layout-editor-item-image')
    const header = document.querySelector('.site-header')
    if (!image || !header) return undefined
    const measure = () => {
      const width = document.documentElement.clientWidth
      const top = clamp(header.getBoundingClientRect().bottom, 0, window.innerHeight)
      const height = Math.max(1, window.innerHeight - top)
      const face = measureArtworkFace(image, top)
      const next = { width, height, top, face, ...layoutTiles(width, height, face, seed.current, colors.current) }
      geometryRef.current = next; setGeometry(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const element of [image, artwork, artwork.parentElement, artwork.closest('.hero'), header]) if (element) observer.observe(element)
    const mutation = new MutationObserver(measure)
    mutation.observe(artwork, { attributes: true, attributeFilter: ['style'] })
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true)
    image.addEventListener('load', measure)
    return () => {
      observer.disconnect(); mutation.disconnect()
      window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true)
      image.removeEventListener('load', measure)
    }
  }, [enabled, phase === 'complete'])

  useEffect(() => {
    cancelAnimationFrame(fillFrame.current); finishFill.current?.(false)
    finishFill.current = null; fillValue.current = 0
    if (phaseRef.current === 'hover') changePhase('ready')
  }, [activeId])

  useEffect(() => {
    const element = mask.current
    if (!element) return undefined
    const stopScroll = event => event.preventDefault()
    element.addEventListener('wheel', stopScroll, { passive: false })
    element.addEventListener('touchmove', stopScroll, { passive: false })
    return () => { element.removeEventListener('wheel', stopScroll); element.removeEventListener('touchmove', stopScroll) }
  }, [enabled, Boolean(geometry), phase === 'complete'])

  const fillTo = (ripple, target, duration) => new Promise(resolve => {
    cancelAnimationFrame(fillFrame.current); finishFill.current?.(false)
    finishFill.current = resolve
    const from = fillValue.current, start = performance.now()
    const tick = now => {
      if (!alive.current || !ripple?.isConnected) { resolve(false); return }
      const progress = duration ? clamp((now - start) / duration, 0, 1) : 1
      fillValue.current = from + (target - from) * easeOut(progress)
      ripple.style.transform = `translate(-50%, -50%) scale(${fillValue.current})`
      if (progress < 1) fillFrame.current = requestAnimationFrame(tick)
      else { finishFill.current = null; resolve(true) }
    }
    fillFrame.current = requestAnimationFrame(tick)
  })
  const hover = (event, entering) => {
    if (locked.current || !ready) return
    changePhase(entering ? 'hover' : 'ready')
    const duration = entering ? config.hoverDuration : config.hoverReverseDuration
    fillTo(event.currentTarget.querySelector('.main-reveal-ripple'), entering ? 1 : 0, duration)
  }
  const flipFrames = (angle, axis = 'Y') => [
    { transform: `perspective(${config.wave.perspective}px) rotate${axis}(0deg)`, opacity: 1, offset: 0 },
    { transform: `perspective(${config.wave.perspective}px) rotate${axis}(${config.preparationAngle * Math.sign(angle)}deg)`, opacity: 1, offset: config.preparationRatio },
    { transform: `perspective(${config.wave.perspective}px) rotate${axis}(${angle * .72}deg)`, opacity: 1, offset: config.wave.fadeStart },
    { transform: `perspective(${config.wave.perspective}px) rotate${axis}(${angle}deg) scaleX(${config.wave.endScale})`, opacity: 0, offset: 1 },
  ]
  const flipSingle = async element => {
    const animation = element.animate(flipFrames(-config.flipAngle), { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : config.singleFlipDuration, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
    animations.current.add(animation)
    let success = true
    try { await animation.finished } catch { success = false }
    animations.current.delete(animation)
    return success && alive.current
  }
  const startExpression = () => {
    setExpression('attention')
    clearTimeout(expressionTimer.current)
    expressionTimer.current = setTimeout(() => {
      expressionTimer.current = null
      if (alive.current && phaseRef.current !== 'complete') setExpression('wink')
    }, config.main1Duration)
  }

  const finalWave = originId => new Promise(resolve => {
    finishMotion.current = resolve
    const start = performance.now(), records = new Map()
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : config.wave.tileDuration
    const spread = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : config.finalWaveDuration - duration
    const tick = now => {
      if (!alive.current) { resolve(false); return }
      const current = geometryRef.current
      const origin = current.tiles.find(tile => tile.id === originId)
      // Lattice coordinates also locate the removed origin after a large resize.
      const [column, row] = originId.split(':').map(Number)
      const originX = origin ? origin.x + origin.size / 2 : current.face.x + column * current.size
      const originY = origin ? origin.y + origin.size / 2 : current.face.y + row * current.size
      const farthest = Math.max(...current.tiles.map(tile => Math.hypot(tile.x + tile.size / 2 - originX, tile.y + tile.size / 2 - originY)), 1)
      const elapsed = now - start - config.finalRevealDelay
      const finishedIds = []
      let remaining = false
      for (const element of scene.current.querySelectorAll('[data-reveal-tile]')) {
        const tile = current.tiles.find(tile => tile.id === element.dataset.revealTile)
        if (!tile || removedRef.current.has(tile.id)) continue
        let record = records.get(tile.id)
        if (!record) {
          const dx = tile.x + tile.size / 2 - originX, dy = tile.y + tile.size / 2 - originY
          const delay = clamp(Math.hypot(dx, dy) / farthest * spread + (hash(`${tile.id}:delay`, seed.current) * 2 - 1) * config.waveDelayVariation, 0, spread)
          record = { delay, axis: Math.abs(dx) > Math.abs(dy) ? 'Y' : 'X', sign: (Math.abs(dx) > Math.abs(dy) ? dx : -dy) >= 0 ? -1 : 1, angle: config.flipAngle + (hash(`${tile.id}:angle`, seed.current) * 2 - 1) * config.flipAngleVariation }
          records.set(tile.id, record)
        }
        const p = clamp((elapsed - record.delay) / duration, 0, 1)
        if (p === 1) { finishedIds.push(tile.id); continue }
        remaining = true
        const prep = config.preparationRatio
        const angle = p < prep ? config.preparationAngle * easeOut(p / prep) : config.preparationAngle + (record.angle - config.preparationAngle) * easeInOut((p - prep) / (1 - prep))
        const fade = easeOut(clamp((p - config.wave.fadeStart) / (1 - config.wave.fadeStart), 0, 1))
        const shrink = easeOut(clamp((p - config.wave.shrinkStart) / (1 - config.wave.shrinkStart), 0, 1))
        element.style.transform = `perspective(${config.wave.perspective}px) rotate${record.axis}(${angle * record.sign}deg) scaleX(${1 - shrink * (1 - config.wave.endScale)})`
        element.style.opacity = `${1 - fade}`
        element.dataset.revealPhase = p === 0 ? 'waiting' : p < prep ? 'lift' : 'flip'
      }
      if (finishedIds.length) {
        finishedIds.forEach(id => removedRef.current.add(id))
        flushSync(() => setRemoved([...removedRef.current]))
      }
      if (!remaining && elapsed >= 0) {
        clearTimeout(expressionTimer.current); expressionTimer.current = null
        finishMotion.current = null
        flushSync(() => { setExpression('original'); changePhase('complete') })
        colors.current.clear(); onComplete?.(); resolve(true)
      } else frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  })

  const activate = async event => {
    if (locked.current || !enabled || !ready) return
    locked.current = true; changePhase('revealing')
    const button = event.currentTarget, actor = button.closest('[data-reveal-tile]')
    const id = actor.dataset.revealTile
    setClickId(id)
    if (!await fillTo(button.querySelector('.main-reveal-ripple'), 1, config.hoverDuration * (1 - fillValue.current))) return
    if (!await flipSingle(actor)) return
    removedRef.current.add(id)
    const last = step + 1 === config.manualRevealCount
    flushSync(() => {
      setRemoved([...removedRef.current]); setClickId(null); setStep(previous => previous + 1)
      if (step === 0) startExpression()
      changePhase(last ? 'final' : 'ready')
    })
    if (last) { await finalWave(id); return }
    locked.current = false
  }

  if (phase === 'complete') return null
  const busy = phase === 'revealing' || phase === 'final'
  const renderTiles = geometry ? [...geometry.tiles] : []
  // A resize may move the clicked square beyond the crop. Keep that same actor
  // mounted until its fill/flip finishes, rather than cancelling into a locked state.
  if (geometry && clickId && !renderTiles.some(tile => tile.id === clickId)) {
    const [column, row] = clickId.split(':').map(Number)
    renderTiles.push({ id: clickId, column, row, size: geometry.size,
      x: geometry.face.x + (column - .5) * geometry.size,
      y: geometry.face.y + (row - .5) * geometry.size,
      color: colors.current.get(clickId) || config.baseColor })
  }
  return <>
    {/* Both decoded differences are already mounted before their first display.
        Their full-frame dimensions exactly follow the original image wrapper. */}
    <img className="main-reveal-expression" src={attention} alt="" aria-hidden="true" style={{ opacity: expression === 'attention' ? 1 : 0 }} />
    <img className="main-reveal-expression" src={wink} alt="" aria-hidden="true" style={{ opacity: expression === 'wink' ? 1 : 0 }} />
    {enabled && geometry && createPortal(
      <div ref={mask} className="main-artwork-reveal" data-phase={phase} data-expression={expression} style={{ top: geometry.top, width: geometry.width, height: geometry.height, zIndex: config.layer.zIndex }} aria-busy={busy} aria-label="Main 頁互動揭幕">
        <div className="edition-reveal-note"><small>THE WORLD IS WAITING</small><strong>{busy ? '正在翻開世界…' : `尋找奶油黃的一格。 ${step + 1} / 5`}</strong><span>滑過染色，點一下揭開。</span></div>
        <div ref={scene} className="main-reveal-scene">
          {renderTiles.filter(tile => !removed.includes(tile.id)).map(tile => {
            const active = tile.id === activeId && step < config.manualRevealCount
            const style = { left: tile.x, top: tile.y, width: tile.size + config.seamOverlap, height: tile.size + config.seamOverlap, '--tile-color': active ? config.activeColor : tile.color, '--gap-color': config.gapColor, '--tile-gap': `${config.tileGap / 2}px`, '--tile-radius': `${config.cornerRadiusRatio * 100}%`, '--ripple-diameter': `${2 * Math.SQRT2 * tile.size}px` }
            return <div key={tile.id} data-reveal-tile={tile.id} className="main-reveal-tile" style={style}>
              {active ? <button type="button" className="main-reveal-surface main-reveal-target" disabled={busy || !ready} onPointerEnter={event => hover(event, true)} onPointerLeave={event => hover(event, false)} onFocus={event => hover(event, true)} onBlur={event => hover(event, false)} onClick={activate} aria-label={`揭開主視覺，第 ${step + 1} 步，共 ${config.manualRevealCount} 步`}><span className="main-reveal-ripple" style={{ background: config.hoverColor }} /></button>
                : <span className="main-reveal-surface" aria-hidden="true" />}
            </div>
          })}
        </div>
      </div>, document.body)}
  </>
}
