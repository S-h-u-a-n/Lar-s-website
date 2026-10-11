import { useEffect, useRef } from 'react'
import bigBreenImage from '../../Art/Big/Big-decoration/Big-square/Big-breen.JPG'
import bigOrangeImage from '../../Art/Big/Big-decoration/Big-square/Big-orange.JPG'
import bigPigImage from '../../Art/Big/Big-decoration/Big-square/Big-pig.JPG'
import bigRedImage from '../../Art/Big/Big-decoration/Big-square/Big-red.JPG'
import bigWreenImage from '../../Art/Big/Big-decoration/Big-square/Big-wreen.JPG'
import bigYellowImage from '../../Art/Big/Big-decoration/Big-square/Big-yellow.JPG'

const ZONES = [
  { x: 0.10, y: 0.13 },
  { x: 0.36, y: 0.10 },
  { x: 0.78, y: 0.14 },
  { x: 0.08, y: 0.46 },
  { x: 0.91, y: 0.44 },
  { x: 0.12, y: 0.82 },
  { x: 0.40, y: 0.90 },
  { x: 0.83, y: 0.84 },
]

const SQUARE_CONFIG = [
  { image: bigOrangeImage, className: 'big-square-orange', zone: 0, sizeMin: 0.15, sizeMax: 0.175, sizeBias: 2.6 },
  { image: bigYellowImage, className: 'big-square-yellow', zone: 1, sizeMin: 0.15, sizeMax: 0.17, sizeBias: 2.8 },
  { image: bigPigImage, className: 'big-square-pig', zone: 2, sizeMin: 0.16, sizeMax: 0.19, sizeBias: 2.4 },
  { image: bigWreenImage, className: 'big-square-wreen', zone: 3, sizeMin: 0.15, sizeMax: 0.18, sizeBias: 2.7 },
  { image: bigOrangeImage, className: 'big-square-orange-outer', zone: 4, sizeMin: 0.16, sizeMax: 0.20, sizeBias: 2.2 },
  { image: bigYellowImage, className: 'big-square-yellow-outer', zone: 5, sizeMin: 0.16, sizeMax: 0.19, sizeBias: 2.4 },
  { image: bigPigImage, className: 'big-square-pig-outer', zone: 6, sizeMin: 0.18, sizeMax: 0.24, sizeBias: 1.4 },
  { image: bigWreenImage, className: 'big-square-wreen-outer', zone: 7, sizeMin: 0.17, sizeMax: 0.22, sizeBias: 1.8 },
  { image: bigBreenImage, className: 'big-square-breen', special: true, zone: 3, sizeMin: 0.27, sizeMax: 0.31, sizeBias: 1 },
  { image: bigRedImage, className: 'big-square-red', special: true, zone: 7, sizeMin: 0.28, sizeMax: 0.31, sizeBias: 1 },
]

const ANGLES = [-31, 18, -8, 27, -22, 11, 34, -15, 24, -6, 29, -19]
const MAX_FRAME_STEP = 0.04
const FADE_IN = 0.9
const FADE_OUT = 0.9
const POINTER_SPEED_LIMIT = 900
const MAX_INTERACTION = 54
const INTERACTION_DAMPING = 2.4

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const sequenceValue = (index, generation, salt) => {
  const value = Math.sin((index + 1) * 19.17 + (generation + 1) * 7.31 + salt * 11.93) * 43758.5453
  return value - Math.floor(value)
}

function BigSquareField() {
  const fieldRef = useRef(null)
  const squareRefs = useRef([])
  const pointerRef = useRef({ x: 0, y: 0, velocityX: 0, velocityY: 0, active: false, time: 0 })

  useEffect(() => {
    const field = fieldRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const particles = SQUARE_CONFIG.map(() => null)
    const geometry = { width: 0, height: 0 }
    let frame = 0
    let previousTime = performance.now()
    let disposed = false

    const measure = () => {
      const rect = field.getBoundingClientRect()
      if (!geometry.width || !geometry.height) {
        geometry.width = rect.width
        geometry.height = rect.height
        return
      }
      const scaleX = rect.width / geometry.width
      const scaleY = rect.height / geometry.height
      const minimum = Math.min(rect.width, rect.height)
      particles.forEach(particle => {
        if (!particle) return
        particle.baseX *= scaleX
        particle.baseY *= scaleY
        particle.size = Math.max(78, minimum * particle.sizeScale)
        particle.node.style.width = `${particle.size}px`
      })
      geometry.width = rect.width
      geometry.height = rect.height
    }

    const spawn = (index, initial = false) => {
      const config = SQUARE_CONFIG[index]
      const previous = particles[index]
      const generation = previous ? previous.generation + 1 : 0
      const zoneIndex = initial ? config.zone : (index * 3 + generation * 5) % ZONES.length
      const zone = ZONES[zoneIndex]
      const jitterX = (sequenceValue(index, generation, 2) - 0.5) * 0.12
      const jitterY = (sequenceValue(index, generation, 3) - 0.5) * 0.10
      const baseX = clamp((zone.x + jitterX) * geometry.width, 20, geometry.width - 20)
      const baseY = clamp((zone.y + jitterY) * geometry.height, 20, geometry.height - 20)
      const direction = sequenceValue(index, generation, 5) * Math.PI * 2
      const speed = config.special ? 4 + sequenceValue(index, generation, 6) * 3 : 5 + sequenceValue(index, generation, 6) * 4
      const sizeRoll = sequenceValue(index, generation, 7) ** (config.sizeBias ?? 2.4)
      const sizeScale = config.sizeMin + sizeRoll * (config.sizeMax - config.sizeMin)
      const size = Math.max(78, Math.min(geometry.width, geometry.height) * sizeScale)
      const node = squareRefs.current[index]
      const particle = {
        generation,
        baseX,
        baseY,
        size,
        sizeScale,
        interactionX: 0,
        interactionY: 0,
        interactionVelocityX: 0,
        interactionVelocityY: 0,
        driftX: Math.cos(direction) * speed,
        driftY: Math.sin(direction) * speed,
        angle: ANGLES[(index * 3 + generation * 5) % ANGLES.length],
        opacity: config.special ? 0.82 : 0.72 + sequenceValue(index, generation, 8) * 0.20,
        age: initial ? 2 + (index % 3) * 0.35 : 0,
        lifetime: 14 + sequenceValue(index, generation, 9) * 9,
        respawnQueued: false,
        node,
      }
      particles[index] = particle
      if (node) {
        node.style.width = `${size}px`
        node.style.opacity = initial && !reducedMotion.matches ? '1' : '0'
      }
    }

    const reset = () => {
      measure()
      SQUARE_CONFIG.forEach((_, index) => spawn(index, true))
      particles.forEach(particle => {
        if (!particle?.node) return
        particle.node.style.opacity = '1'
        particle.node.style.transform = `translate3d(${particle.baseX - particle.size / 2}px, ${particle.baseY - particle.size / 2}px, 0) rotate(${particle.angle}deg)`
      })
    }

    const updatePointer = event => {
      const now = performance.now()
      const pointer = pointerRef.current
      const delta = Math.max((now - pointer.time) / 1000, 0.001)
      const velocityX = clamp((event.clientX - pointer.x) / delta, -POINTER_SPEED_LIMIT, POINTER_SPEED_LIMIT)
      const velocityY = clamp((event.clientY - pointer.y) / delta, -POINTER_SPEED_LIMIT, POINTER_SPEED_LIMIT)
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        velocityX: pointer.time ? velocityX : 0,
        velocityY: pointer.time ? velocityY : 0,
        active: true,
        time: now,
      }
    }
    const clearPointer = event => {
      if (!event.relatedTarget) pointerRef.current.active = false
    }

    const render = now => {
      if (disposed || reducedMotion.matches) return
      const delta = Math.min((now - previousTime) / 1000, MAX_FRAME_STEP)
      previousTime = now
      const pointer = pointerRef.current
      pointer.velocityX *= Math.exp(-5 * delta)
      pointer.velocityY *= Math.exp(-5 * delta)

      particles.forEach((particle, index) => {
        if (!particle) return
        particle.age += delta
        if (particle.age >= particle.lifetime) {
          if (!particle.respawnQueued) {
            particle.node.style.opacity = '0'
            particle.respawnQueued = true
            return
          }
          spawn(index)
          return
        }

        const normalX = particle.baseX + particle.driftX * particle.age
        const normalY = particle.baseY + particle.driftY * particle.age
        const currentX = normalX + particle.interactionX
        const currentY = normalY + particle.interactionY
        const dx = currentX - pointer.x
        const dy = currentY - pointer.y
        const distance = pointer.active ? Math.hypot(dx, dy) : Infinity
        const radius = particle.size * 0.72 + 115
        const proximity = Math.max(0, 1 - distance / radius)
        const pointerSpeed = Math.min(1, Math.hypot(pointer.velocityX, pointer.velocityY) / 700)
        const impulse = proximity * proximity * (230 + pointerSpeed * 180) * delta
        if (distance > 0 && proximity > 0) {
          particle.interactionVelocityX += (dx / distance) * impulse
          particle.interactionVelocityY += (dy / distance) * impulse
        }
        particle.interactionVelocityX *= Math.exp(-INTERACTION_DAMPING * delta)
        particle.interactionVelocityY *= Math.exp(-INTERACTION_DAMPING * delta)
        const interactionSpeed = Math.hypot(particle.interactionVelocityX, particle.interactionVelocityY)
        if (interactionSpeed > 105) {
          particle.interactionVelocityX = particle.interactionVelocityX / interactionSpeed * 105
          particle.interactionVelocityY = particle.interactionVelocityY / interactionSpeed * 105
        }
        particle.interactionX += particle.interactionVelocityX * delta
        particle.interactionY += particle.interactionVelocityY * delta
        const interactionDistance = Math.hypot(particle.interactionX, particle.interactionY)
        if (interactionDistance > MAX_INTERACTION) {
          particle.interactionX = particle.interactionX / interactionDistance * MAX_INTERACTION
          particle.interactionY = particle.interactionY / interactionDistance * MAX_INTERACTION
        }

        let opacity = 1
        if (particle.age < FADE_IN) opacity = particle.age / FADE_IN
        if (particle.lifetime - particle.age < FADE_OUT) opacity = (particle.lifetime - particle.age) / FADE_OUT
        particle.node.style.opacity = String(clamp(opacity, 0, 1))
        particle.node.style.transform = `translate3d(${currentX - particle.size / 2}px, ${currentY - particle.size / 2}px, 0) rotate(${particle.angle}deg)`
      })

      frame = requestAnimationFrame(render)
    }
    const start = () => {
      cancelAnimationFrame(frame)
      if (reducedMotion.matches) {
        reset()
        return
      }
      previousTime = performance.now()
      frame = requestAnimationFrame(render)
    }
    const resize = () => measure()
    const preference = () => start()

    reset()
    window.addEventListener('pointermove', updatePointer, { passive: true })
    window.addEventListener('pointerout', clearPointer, { passive: true })
    window.addEventListener('resize', resize)
    reducedMotion.addEventListener('change', preference)
    start()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', updatePointer)
      window.removeEventListener('pointerout', clearPointer)
      window.removeEventListener('resize', resize)
      reducedMotion.removeEventListener('change', preference)
    }
  }, [])

  return (
    <div ref={fieldRef} className="big-square-field" aria-hidden="true">
      {SQUARE_CONFIG.map((config, index) => (
        <img
          key={config.className}
          ref={element => { squareRefs.current[index] = element }}
          className={`big-square-item ${config.className}`}
          src={config.image}
          alt=""
        />
      ))}
    </div>
  )
}

export default BigSquareField
