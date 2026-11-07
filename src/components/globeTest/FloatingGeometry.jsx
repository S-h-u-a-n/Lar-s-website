import { useLayoutEffect, useRef } from 'react'
import { geometryFloat, geometryPointerGain } from './geometryMotion'

const SQUARES = [
  { id: 'pink', className: 'gt-pink-square' },
  { id: 'yellow', className: 'gt-yellow-square' },
  { id: 'sky', style: { left: '47%', top: '19%', '--square-size': 'clamp(20px,2.1vw,32px)', '--square-color': 'var(--gt-blue)', '--square-angle': '-16deg' } },
  { id: 'mint', style: { right: '2.5%', top: '65%', '--square-size': 'clamp(24px,2.6vw,40px)', '--square-color': 'var(--gt-mint)', '--square-angle': '17deg' } },
  { id: 'peach', style: { left: '51%', bottom: '16%', '--square-size': 'clamp(18px,1.7vw,26px)', '--square-color': 'var(--gt-peach)', '--square-angle': '-9deg' } },
  { id: 'butter', style: { left: '59%', top: '10%', '--square-size': 'clamp(16px,1.5vw,23px)', '--square-color': 'var(--gt-yellow)', '--square-angle': '24deg' } },
  { id: 'rose', style: { left: '44%', bottom: '6%', '--square-size': 'clamp(17px,1.8vw,28px)', '--square-color': 'var(--gt-pink)', '--square-angle': '11deg' } },
]

export default function FloatingGeometry() {
  const root = useRef(null)
  useLayoutEffect(() => {
    const host = root.current
    const nodes = [...host.querySelectorAll('[data-floating-square]')]
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, previous = 0, seconds = 0, alive = true
    nodes.forEach((node, index) => {
      const gain = geometryPointerGain(index)
      node.style.removeProperty('translate')
      node.style.setProperty('--gt-pointer-gain-x', `${gain.x}px`)
      node.style.setProperty('--gt-pointer-gain-y', `${gain.y}px`)
    })
    function paint(time) {
      frame = 0
      if (!alive || reduced.matches || document.hidden) return
      const dt = Math.min(.032, (time - (previous || time - 16)) / 1000)
      previous = time; seconds += dt
      nodes.forEach((node, index) => {
        const drift = geometryFloat(seconds, index)
        node.style.setProperty('--gt-float-x', `${drift.x.toFixed(3)}px`)
        node.style.setProperty('--gt-float-y', `${drift.y.toFixed(3)}px`)
      })
      frame = requestAnimationFrame(paint)
    }
    function resume() {
      cancelAnimationFrame(frame); frame = 0; previous = 0
      if (reduced.matches) {
        nodes.forEach(node => { node.style.setProperty('--gt-float-x', '0px'); node.style.setProperty('--gt-float-y', '0px') })
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
  }, [])
  return <div ref={root} className="gt-decor" aria-hidden="true">
    <i className="gt-disc" />
    <i className="gt-stripes gt-floating-square" data-floating-square="stripes" />
    <i className="gt-grid gt-floating-square" data-floating-square="grid" />
    {SQUARES.map(square => <i key={square.id} className={`gt-floating-square ${square.className || 'gt-extra-square'}`} data-floating-square={square.id} style={square.style} />)}
  </div>
}
