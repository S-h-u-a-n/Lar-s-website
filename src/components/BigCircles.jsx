import { useEffect, useRef } from 'react'
import circle2Image from '../../Art/Big/Big-decoration/Big-circle2.PNG'
import circle3Image from '../../Art/Big/Big-decoration/Big-circle3.PNG'
import circle4Image from '../../Art/Big/Big-decoration/Big-circle4.PNG'

const CIRCLE_CONFIG = [
  { image: circle2Image, className: 'big-foundation-circle-2', centerX: 0.69, centerY: 0.80, radius: 210, amplitude: 17, speed: 0.65, phase: 2.8, maxDisplacement: 24 },
  { image: circle3Image, className: 'big-foundation-circle-3', centerX: 0.56, centerY: 0.34, radius: 230, amplitude: 21, speed: 0.78, phase: 0.3, maxDisplacement: 27 },
  { image: circle4Image, className: 'big-foundation-circle-4', centerX: 0.34, centerY: 0.47, radius: 190, amplitude: 14, speed: 0.72, phase: 4.5, maxDisplacement: 20 },
]

const MAX_FRAME_STEP = 0.05
const SPRING = 3.2
const DAMPING = 4.6

function BigCircles() {
  const circleRefs = useRef([])
  const pointerRef = useRef({ x: 0, y: 0, active: false })
  const compositionRef = useRef(null)

  useEffect(() => {
    const composition = compositionRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const states = CIRCLE_CONFIG.map(() => ({ displacement: 0, velocity: 0 }))
    let frame = 0
    let previousTime = performance.now()
    let elapsed = 0
    let disposed = false

    const updatePointer = event => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true }
    }
    const clearPointer = event => {
      if (!event.relatedTarget) pointerRef.current.active = false
    }
    const resetCircles = () => {
      circleRefs.current.forEach(circle => {
        if (circle) circle.style.transform = 'translate3d(0, 0, 0)'
      })
    }
    const render = now => {
      if (disposed) return
      const delta = Math.min((now - previousTime) / 1000, MAX_FRAME_STEP)
      previousTime = now
      elapsed += delta
      const compositionRect = composition.getBoundingClientRect()
      const pointer = pointerRef.current

      CIRCLE_CONFIG.forEach((config, index) => {
        const circle = circleRefs.current[index]
        if (!circle) return
        const state = states[index]
        const centerX = compositionRect.left + compositionRect.width * config.centerX
        const centerY = compositionRect.top + compositionRect.height * config.centerY
        const pointerDistance = pointer.active
          ? Math.hypot(pointer.x - centerX, pointer.y - centerY)
          : Infinity
        const proximity = Math.max(0, 1 - pointerDistance / config.radius)
        const direction = pointer.x < centerX ? 1 : -1
        const interactionTarget = direction * proximity * config.maxDisplacement
        const springForce = (interactionTarget - state.displacement) * SPRING
        state.velocity += springForce * delta
        state.velocity *= Math.exp(-DAMPING * delta)
        state.displacement += state.velocity * delta
        const idleOffset = Math.sin(elapsed * config.speed + config.phase) * config.amplitude
        circle.style.transform = `translate3d(${idleOffset + state.displacement}px, 0, 0)`
      })

      frame = requestAnimationFrame(render)
    }
    const start = () => {
      cancelAnimationFrame(frame)
      if (reducedMotion.matches) {
        resetCircles()
        return
      }
      previousTime = performance.now()
      frame = requestAnimationFrame(render)
    }
    const handleMotionPreference = () => start()

    window.addEventListener('pointermove', updatePointer, { passive: true })
    window.addEventListener('pointerout', clearPointer, { passive: true })
    reducedMotion.addEventListener('change', handleMotionPreference)
    start()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', updatePointer)
      window.removeEventListener('pointerout', clearPointer)
      reducedMotion.removeEventListener('change', handleMotionPreference)
      resetCircles()
    }
  }, [])

  return (
    <div ref={compositionRef} className="big-foundation-circles" aria-hidden="true">
      {CIRCLE_CONFIG.map((config, index) => (
        <img
          key={config.className}
          ref={element => { circleRefs.current[index] = element }}
          className={`big-foundation-circle ${config.className}`}
          src={config.image}
          alt=""
        />
      ))}
    </div>
  )
}

export default BigCircles
