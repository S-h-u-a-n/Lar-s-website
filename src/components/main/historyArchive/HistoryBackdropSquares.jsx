import { useLayoutEffect, useRef } from 'react'
import HistorySquares from '../../../dev/history/HistorySquares'
import { HISTORY } from '../../../dev/history/config'
import { seeded, squareLayout } from '../../../dev/history/squareLayout'

// Generate once, with a separate seeded size distribution. React renders and
// horizontal exploration never reshuffle the 24 anchors or size assignments.
const sourceCount = Object.keys(import.meta.glob('/Art/IntroScreen/square/*.PNG')).length
const sizeRandom = seeded(612)
const sizeRanges = [
  ...Array.from({ length: 12 }, () => [16, 30]),
  ...Array.from({ length: 7 }, () => [44, 68]),
  ...Array.from({ length: 5 }, () => [96, 132]),
]
for (let i = sizeRanges.length - 1; i > 0; i--) {
  const j = Math.floor(sizeRandom() * (i + 1))
  ;[sizeRanges[i], sizeRanges[j]] = [sizeRanges[j], sizeRanges[i]]
}
const particles = squareLayout({ ...HISTORY.squares, count: sizeRanges.length }, HISTORY.width, HISTORY.height, sourceCount)
  .map((particle, index) => {
    const [min, max] = sizeRanges[index]
    return {
      ...particle,
      size: min + sizeRandom() * (max - min),
      // Entry drift shrinks with the short white viewport. Restore visible
      // travel locally, without speeding up its fade/rotation cycle.
      dx: particle.dx * 2.8,
      dy: particle.dy * 2.8,
      sway: particle.sway * 2.8,
    }
  })

// Keep the entry's artwork, timing and animation engine intact. Only adapt its
// reference-space geometry to the stationary white area, outside the panorama.
export default function HistoryBackdropSquares({ height }) {
  const host = useRef(null), squares = useRef(null)
  useLayoutEffect(() => {
    const element = host.current
    let visible = false
    const update = () => {
      squares.current?.update(visible ? {
        scale: Math.max(element.clientHeight / HISTORY.height, element.clientWidth / HISTORY.width),
        sizeMultiplier: 1.15 * 1.5,
        speedMultiplier: 1.1 * 1.06,
        cameraPx: 0,
        viewportWidth: element.clientWidth,
      } : null)
    }
    const resize = new ResizeObserver(update)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    resize.observe(element)
    intersection.observe(element)
    return () => {
      squares.current?.update(null)
      resize.disconnect()
      intersection.disconnect()
    }
  }, [])
  return <div ref={host} className="hh-background-squares" style={{ height }} aria-hidden="true"><HistorySquares ref={squares} particles={particles}/></div>
}
