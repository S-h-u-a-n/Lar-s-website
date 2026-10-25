import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { CAMERA, STYLE } from './data'
const clampScale = (value, minimum) => Math.min(CAMERA.maxScale, Math.max(minimum, value))
// Same cubic-bezier curve as BigTest, evaluated for the requestAnimationFrame camera.
function easing(time) {
  let t = time
  for (let i = 0; i < 6; i++) {
    const x = 3 * (1 - t) ** 2 * t * .22 + 3 * (1 - t) * t * t * .25 + t ** 3
    const slope = 3 * (1 - t) ** 2 * .22 + 6 * (1 - t) * t * (.25 - .22) + 3 * t * t * (1 - .25)
    if (Math.abs(slope) < .001) break
    t = Math.max(0, Math.min(1, t - (x - time) / slope))
  }
  return 3 * (1 - t) ** 2 * t * .75 + 3 * (1 - t) * t * t + t ** 3
}
export default function useResearchCamera(bounds, minimumScale = CAMERA.minScale) {
  const viewportRef = useRef(null), worldRef = useRef(null)
  const view = useRef({ x: 0, y: 0, scale: .3 }), target = useRef(view.current)
  const size = useRef({ width: 1, height: 1 }), frame = useRef(null), drag = useRef(null)
  const intent = useRef({ type: 'overview' }), suppressClick = useRef(false)
  const [level, setLevel] = useState('overview')
  const levelRef = useRef('overview')
  const boundsRef = useRef(bounds); boundsRef.current = bounds
  const minimum = useCallback(() => {
    const b = boundsRef.current, s = size.current
    return Math.min(minimumScale, Math.max(.02, Math.min((s.width - CAMERA.padding * 2) / b.width, (s.height - CAMERA.padding * 2) / b.height)))
  }, [minimumScale])
  const paint = useCallback(next => {
    view.current = next
    viewportRef.current?.style.setProperty('--camera-scale',next.scale)
    if (worldRef.current) worldRef.current.style.transform = `translate3d(${next.x}px,${next.y}px,0) scale(${next.scale})`
    const normalThreshold = Math.min(CAMERA.normalThreshold, CAMERA.normalThreshold * size.current.height / 600, CAMERA.normalThreshold * size.current.width / 1000)
    const tier = next.scale < normalThreshold ? 'overview' : next.scale < CAMERA.detailThreshold ? 'normal' : 'detail'
    if (tier !== levelRef.current) { levelRef.current = tier; setLevel(tier) }
  }, [])
  const stop = useCallback(() => { if (frame.current !== null) cancelAnimationFrame(frame.current); frame.current = null; target.current = view.current }, [])
  const move = useCallback((next, animate = true, options = {}) => {
    stop()
    next = { ...next, scale: clampScale(next.scale, minimum()) }
    target.current = next
    const from = { ...view.current }, started = performance.now()
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { paint(next); options.onComplete?.(); return }
    const tick = now => {
      const progress = Math.min(1, (now - started) / (options.duration ?? STYLE.motion.duration)), amount = easing(progress)
      paint({ x: from.x + (next.x - from.x) * amount, y: from.y + (next.y - from.y) * amount, scale: from.scale + (next.scale - from.scale) * amount })
      if (progress < 1) frame.current = requestAnimationFrame(tick)
      else { frame.current = null; options.onComplete?.() }
    }
    frame.current = requestAnimationFrame(tick)
  }, [paint, stop, minimum])
  const center = useCallback((point, scale, fraction = .5, animate = true, options) => {
    scale = clampScale(scale, minimum())
    move({ x: size.current.width * fraction - point.x * scale, y: size.current.height / 2 - point.y * scale, scale }, animate, options)
  }, [move, minimum])
  const overview = useCallback((animate = true) => {
    intent.current = { type: 'overview' }
    const b = boundsRef.current, s = size.current
    const scale = Math.min((s.width - CAMERA.padding * 2) / b.width, (s.height - CAMERA.padding * 2) / b.height)
    center({ x: b.x + b.width / 2, y: b.y + b.height / 2 }, scale, .5, animate)
  }, [center])
  const locate = useCallback((point, scale, fraction = .5, options) => { intent.current = { type: 'point', point, scale, fraction }; center(point, scale, fraction, true, options) }, [center])
  const interrupt = useCallback(() => { stop(); intent.current = { type: 'free' } }, [stop])
  const snapshot = useCallback(() => { const v = view.current; return { x: (size.current.width / 2 - v.x) / v.scale, y: (size.current.height / 2 - v.y) / v.scale, scale: v.scale, intent: intent.current } }, [])
  const restore = useCallback(saved => { intent.current = saved.intent; center(saved, saved.scale) }, [center])
  const zoom = useCallback((factor, anchor) => {
    intent.current = { type: 'free' }
    const base = target.current, a = anchor || { x: size.current.width / 2, y: size.current.height / 2 }, scale = clampScale(base.scale * factor, minimum())
    move({ x: a.x - (a.x - base.x) / base.scale * scale, y: a.y - (a.y - base.y) / base.scale * scale, scale })
  }, [move, minimum])
  useLayoutEffect(() => {
    const element = viewportRef.current
    size.current = { width: element.clientWidth, height: element.clientHeight }
    overview(false)
    const observer = new ResizeObserver(() => {
      const old = size.current, next = { width: element.clientWidth, height: element.clientHeight }, v = view.current
      size.current = next
      const currentIntent = intent.current
      if (currentIntent.type === 'overview') overview(false)
      else if (currentIntent.type === 'point') center(currentIntent.point, currentIntent.scale, currentIntent.fraction, false)
      else move({ ...v, x: v.x + (next.width - old.width) / 2, y: v.y + (next.height - old.height) / 2 }, false)
    })
    const wheel = event => {
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1)
      zoom(Math.exp(-Math.max(-120, Math.min(120, delta)) * .0025), { x: event.clientX - rect.left, y: event.clientY - rect.top })
    }
    observer.observe(element)
    element.addEventListener('wheel', wheel, { passive: false })
    return () => { observer.disconnect(); element.removeEventListener('wheel', wheel); stop() }
  }, [center, move, overview, stop, zoom])
  const handlers = {
    onPointerDown(event) {
      if (event.button !== 0) return
      stop(); suppressClick.current = false
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view: { ...view.current }, moved: false }
    },
    onPointerMove(event) {
      const d = drag.current
      if (!d || d.id !== event.pointerId) return
      const dx = event.clientX - d.x, dy = event.clientY - d.y
      if (!d.moved && Math.hypot(dx, dy) < 5) return
      if (!d.moved) { d.moved = true; viewportRef.current.setPointerCapture(event.pointerId); viewportRef.current.classList.add('is-dragging') }
      intent.current = { type: 'free' }
      const b=boundsRef.current,s=size.current,scale=d.view.scale
      const next={...d.view,x:Math.max(100-(b.x+b.width)*scale,Math.min(s.width-100-b.x*scale,d.view.x+dx)),y:Math.max(100-(b.y+b.height)*scale,Math.min(s.height-100-b.y*scale,d.view.y+dy))}
      target.current = next; paint(next)
    },
    onPointerUp(event) {
      if (!drag.current || drag.current.id !== event.pointerId) return
      suppressClick.current = drag.current.moved; drag.current = null
      if (viewportRef.current.hasPointerCapture(event.pointerId)) viewportRef.current.releasePointerCapture(event.pointerId)
      viewportRef.current.classList.remove('is-dragging')
    },
    onPointerCancel() { drag.current = null; suppressClick.current = true; viewportRef.current.classList.remove('is-dragging') },
    onClickCapture(event) { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } },
  }
  return { viewportRef, worldRef, level, overview, locate, snapshot, restore, zoom, interrupt, handlers }
}
