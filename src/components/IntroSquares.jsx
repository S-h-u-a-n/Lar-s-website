import { useEffect, useRef } from 'react'
import './IntroSquares.css'

const assets = Object.values(import.meta.glob('../../畫/IntroScreen/square/*.PNG', {
  eager: true, query: '?url', import: 'default',
}))
const random = (min, max) => min + Math.random() * (max - min)
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const smooth = t => t * t * (3 - 2 * t)
const randomSquareSize = mobile => {
  const roll = Math.random()
  if (roll < 0.45) return random(12, 25)
  if (roll < 0.85) return random(28, 50)
  return random(55, 80)
}

export default function IntroSquares({ leaving }) {
  const layerRef = useRef(null)
  useEffect(() => {
    if (leaving) return
    const layer = layerRef.current
    const screen = layer.closest('.intro-screen')
    const content = screen.querySelector('.intro-content')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const mouse = matchMedia('(hover: hover) and (pointer: fine)')
    const nodes = [...layer.children]
    const pointer = { x: 0, y: 0, active: false }
    let particles = [], frame = 0, previous = 0, elapsed = 0
    let disposed = false, measureNeeded = true, geometry

    // Layout is read only on resize/font load, before any animation writes.
    const measure = () => {
      const bounds = screen.getBoundingClientRect()
      const mobile = bounds.width <= 600
      const rects = [...content.querySelectorAll('.intro-kicker, .intro-title-pre, .genesis-letters, .intro-title-subtitle, .intro-enter')]
        .map(node => node.getBoundingClientRect())
      const left = Math.min(...rects.map(r => r.left)) - bounds.left
      const right = Math.max(...rects.map(r => r.right)) - bounds.left
      const top = Math.min(...rects.map(r => r.top)) - bounds.top
      const bottom = Math.max(...rects.map(r => r.bottom)) - bounds.top
      const cx = (left + right) / 2, cy = (top + bottom) / 2
      let rx = (right - left) / 2 + (mobile ? 18 : 30)
      let ry = (bottom - top) / 2 + (mobile ? 18 : 26)
      // Fit the ellipse to actual text/control corners, not an oversized container.
      let fit = 1
      for (const r of rects) for (const x of [r.left - bounds.left - 8, r.right - bounds.left + 8]) {
        for (const y of [r.top - bounds.top - 8, r.bottom - bounds.top + 8]) {
          fit = Math.max(fit, Math.hypot((x - cx) / rx, (y - cy) / ry))
        }
      }
      rx *= fit; ry *= fit
      geometry = { width: bounds.width, height: bounds.height, mobile, cx, cy, rx, ry,
        originX: bounds.left, originY: bounds.top }
      measureNeeded = false
    }
    // Smoothly bend the entire proposed trajectory before rendering it. The
    // radius allowance protects the full rotated image, including mouse offsets.
    const avoidText = (x, y, radius) => {
      const { cx, cy, rx, ry } = geometry
      const ax = rx + radius * Math.SQRT2, ay = ry + radius * Math.SQRT2
      const nx = (x - cx) / ax, ny = (y - cy) / ay
      const distance = Math.hypot(nx, ny)
      if (distance < .0001) return { x: cx, y: cy - ay * 1.02 }
      const band = .14
      const safeDistance = 1 + band * Math.log1p(Math.exp(Math.min(50, (distance - 1) / band)))
      const scale = distance > 3 ? 1 : safeDistance / distance
      return { x: cx + (x - cx) * scale, y: cy + (y - cy) * scale }
    }
    const spawn = (node, index, initial = false) => {
      const g = geometry
      const size = randomSquareSize(g.mobile)
      const radius = size * .72 // Includes the rotated square's corners.
      // Best-candidate sampling keeps randomness while preferring open space.
      // A small side preference balances left/right without restricting movement.
      let best = null, bestScore = -Infinity
      for (let attempt = 0; attempt < 90; attempt++) {
        const candidate = avoidText(random(radius, g.width - radius), random(radius, g.height - radius), radius)
        if (candidate.x < radius || candidate.x > g.width - radius || candidate.y < radius || candidate.y > g.height - radius) continue
        let score = Math.min(g.width, g.height)
        for (const other of particles) {
          if (other.node === node || other.unavailable) continue
          const gap = Math.hypot(candidate.x - other.worldX, candidate.y - other.worldY) - (size + other.size) * .64
          score = Math.min(score, gap)
        }
        const preferredSide = index % 2 ? candidate.x > g.cx : candidate.x < g.cx
        score += preferredSide ? 10 : 0
        score += random(-8, 8)
        if (score > bestScore) { best = candidate; bestScore = score }
        if (score > (g.mobile ? 20 : 36) && attempt > 12) break
      }
      if (!best) return { node, start: elapsed + 1000, unavailable: true }
      const { x, y } = best
      const opacityRoll = Math.random()
      const opacity = opacityRoll < .85 ? 1 : opacityRoll < .95 ? .8 : .7
      const src = assets[Math.floor(Math.random() * assets.length)]
      node.src = src
      node.style.width = `${size}px`
      node.style.height = `${size}px`
      return { node, size, radius, x, y, worldX: x, worldY: y,
        spacingX: 0, spacingY: 0,
        dx: random(-40, 40), dy: -random(70, 160), sway: random(3, 9),
        angle: random(-8, 8), turn: random(-5, 5), phase: random(0, Math.PI * 2),
        opacity, duration: random(14000, 22000),
        start: elapsed + (initial ? index * 550 + random(0, 1600) : random(500, 3000)),
        offsetX: 0, offsetY: 0, velocityX: 0, velocityY: 0 }
    }
    const reset = () => {
      measure()
      const count = reduced.matches ? (geometry.mobile ? 2 : 4) : (geometry.mobile ? 12 : 15)
      particles = []
      nodes.slice(0, count).forEach((node, i) => particles.push(spawn(node, i, true)))
      nodes.forEach(node => { node.style.opacity = '0' })
      if (reduced.matches) particles.forEach(p => {
        if (p.unavailable) return
        p.node.style.transform = `translate3d(${p.x - p.size / 2}px, ${p.y - p.size / 2}px, 0) rotate(${p.angle}deg)`
        p.node.style.opacity = String(p.opacity)
      })
    }
    const tick = now => {
      frame = 0
      if (disposed || document.hidden || reduced.matches) return
      const dt = previous ? Math.min((now - previous) / 1000, .032) : 1 / 60
      previous = now
      elapsed += dt * 1000
      if (measureNeeded) reset()
      const positions = particles.map(p => ({ x: p.worldX, y: p.worldY, size: p.size,
        visible: !p.unavailable && elapsed >= p.start }))
      particles.forEach((p, i) => {
        if (elapsed < p.start) return
        if (p.unavailable || elapsed - p.start >= p.duration) {
          p.node.style.opacity = '0'
          particles[i] = spawn(p.node, i)
          return
        }
        const t = (elapsed - p.start) / p.duration
        const baseX = p.x + p.dx * t + Math.sin(t * Math.PI * 2 + p.phase) * p.sway
        const baseY = p.y + p.dy * t
        let separateX = 0, separateY = 0
        positions.forEach((other, j) => {
          if (j === i || !other.visible) return
          const dx = p.worldX - other.x, dy = p.worldY - other.y
          const distance = Math.hypot(dx, dy)
          const clearance = (p.size + other.size) * .65 + 16
          if (distance < clearance) {
            const strength = (clearance - distance) * .45
            separateX += distance > .1 ? dx / distance * strength : (i < j ? -1 : 1) * strength
            separateY += distance > .1 ? dy / distance * strength : 0
          }
        })
        const follow = 1 - Math.exp(-dt * 1.8)
        p.spacingX += (clamp(separateX, -24, 24) - p.spacingX) * follow
        p.spacingY += (clamp(separateY, -24, 24) - p.spacingY) * follow
        let targetX = 0, targetY = 0
        if (pointer.active && mouse.matches && !geometry.mobile) {
          const dx = p.worldX - pointer.x, dy = p.worldY - pointer.y
          const distance = Math.hypot(dx, dy)
          const range = 120 + (90 - p.size) * .25
          const strength = Math.pow(Math.max(0, 1 - distance / range), 2) * (32 + (90 - p.size) * .18)
          targetX = distance > .1 ? dx / distance * strength : (i % 2 ? 1 : -1) * strength
          targetY = distance > .1 ? dy / distance * strength : 0
        }
        // Damped spring adds mouse offset to the independent drifting position.
        p.velocityX += ((targetX - p.offsetX) * 48 - p.velocityX * 11.8) * dt
        p.velocityY += ((targetY - p.offsetY) * 48 - p.velocityY * 11.8) * dt
        p.offsetX = clamp(p.offsetX + p.velocityX * dt, -48, 48)
        p.offsetY = clamp(p.offsetY + p.velocityY * dt, -48, 48)
        const { x, y } = avoidText(baseX + p.offsetX + p.spacingX, baseY + p.offsetY + p.spacingY, p.radius)
        p.worldX = x; p.worldY = y
        const fade = smooth(clamp(t / .12, 0, 1)) * smooth(clamp((1 - t) / .10, 0, 1))
        p.node.style.opacity = String(p.opacity * fade)
        p.node.style.transform = `translate3d(${x - p.size / 2}px, ${y - p.size / 2}px, 0) rotate(${p.angle + p.turn * Math.sin(t * Math.PI)}deg)`
      })
      frame = requestAnimationFrame(tick)
    }
    const start = () => {
      if (!disposed && !frame && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick)
    }
    const move = event => {
      if (event.pointerType !== 'mouse' || !mouse.matches || reduced.matches) return
      pointer.x = event.clientX - geometry.originX
      pointer.y = event.clientY - geometry.originY
      pointer.active = true
    }
    const leave = () => { pointer.active = false }
    const resize = () => {
      measureNeeded = true
      if (reduced.matches) reset()
    }
    const preference = () => {
      cancelAnimationFrame(frame); frame = 0; previous = 0
      leave(); reset(); start()
    }
    const visibility = () => {
      leave(); previous = 0
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0 }
      else start()
    }
    reset(); start()
    const observer = new ResizeObserver(resize)
    observer.observe(screen); observer.observe(content)
    screen.addEventListener('pointermove', move, { passive: true })
    screen.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    document.addEventListener('visibilitychange', visibility)
    reduced.addEventListener('change', preference)
    mouse.addEventListener('change', leave)
    document.fonts.ready.then(() => { if (!disposed) resize() })
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      screen.removeEventListener('pointermove', move)
      screen.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      document.removeEventListener('visibilitychange', visibility)
      reduced.removeEventListener('change', preference)
      mouse.removeEventListener('change', leave)
    }
  }, [leaving])
  return <div ref={layerRef} className="intro-squares" aria-hidden="true">
    {Array.from({ length: 20 }, (_, i) => <img key={i} alt="" draggable="false" decoding="async" />)}
  </div>
}
