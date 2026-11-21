import { useLayoutEffect } from 'react'
import { geometryFloat, geometryPointerGain } from './geometryMotion'

// Same drift and pointer inertia for Globe and Telescope decorations.
export default function useFloatingGeometry(root, prefix = 'gt') {
  useLayoutEffect(() => {
    const host = root.current
    const nodes = [...host.querySelectorAll('[data-floating-square]')]
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, previous = 0, seconds = 0, alive = true
    nodes.forEach((node, index) => {
      const gain = geometryPointerGain(index)
      node.style.removeProperty('translate')
      node.style.setProperty(`--${prefix}-pointer-gain-x`, `${gain.x}px`)
      node.style.setProperty(`--${prefix}-pointer-gain-y`, `${gain.y}px`)
    })
    function paint(time) {
      frame = 0
      if (!alive || reduced.matches || document.hidden) return
      const dt = Math.min(.032, (time - (previous || time - 16)) / 1000)
      previous = time; seconds += dt
      nodes.forEach((node, index) => {
        const drift = geometryFloat(seconds, index)
        node.style.setProperty(`--${prefix}-float-x`, `${drift.x.toFixed(3)}px`)
        node.style.setProperty(`--${prefix}-float-y`, `${drift.y.toFixed(3)}px`)
      })
      frame = requestAnimationFrame(paint)
    }
    function resume() {
      cancelAnimationFrame(frame); frame = 0; previous = 0
      if (reduced.matches) {
        nodes.forEach(node => { node.style.setProperty(`--${prefix}-float-x`, '0px'); node.style.setProperty(`--${prefix}-float-y`, '0px') })
      } else if (!document.hidden) frame = requestAnimationFrame(paint)
    }
    // Pointer tracking, inertia and reset remain owned by useParallax. CSS adds
    // that shared motion to these drift offsets without replacing rotations.
    reduced.addEventListener('change', resume)
    document.addEventListener('visibilitychange', resume)
    resume()
    return () => {
      alive = false; cancelAnimationFrame(frame)
      reduced.removeEventListener('change', resume)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [root, prefix])
}
