import { useLayoutEffect, useRef } from 'react'

export default function HomeGeometry() {
  const root = useRef(null), svg = useRef(null), line = useRef(null), lead = useRef(null)
  useLayoutEffect(() => {
    const host = root.current.parentElement
    const hero = host.querySelector('.edition-hero')
    const footer = host.parentElement.querySelector('.site-footer')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, total = 1, initial = 0, start = 0, travel = 1
    let displayed = 0, lastTime = 0
    const DRAW_EXPONENT = 1.7, FOLLOW_MS = 90
    const paint = (now = performance.now(), snap = false) => {
      frame = 0
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / travel))
      const target = progress ** DRAW_EXPONENT
      const dt = lastTime ? Math.max(1, Math.min(64, now - lastTime)) : 16
      lastTime = now
      displayed = snap || reduced.matches ? target : displayed + (target - displayed) * (1 - Math.exp(-dt / FOLLOW_MS))
      if (Math.abs(target - displayed) < .0001) displayed = target
      const drawn = reduced.matches ? total : initial + (total - initial) * displayed
      line.current.style.strokeDashoffset = `${total - drawn}`
      root.current.dataset.drawProgress = progress.toFixed(4)
      root.current.dataset.drawMapped = displayed.toFixed(4)
      if (displayed !== target) frame = requestAnimationFrame(paint)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    const measure = () => {
      const w = host.clientWidth, h = host.offsetHeight, hh = hero.offsetHeight
      const canvasHeight = h + (footer?.offsetHeight || 0)
      root.current.style.height = `${canvasHeight}px`
      root.current.style.bottom = 'auto'
      // Trace coordinates measured in the 2048 × 1164 reference image.
      // One isotropic scale preserves the ellipse and bending radii; subtract
      // Home's document offset because the reference includes the header.
      const scale = w / 2048
      const homeTop = host.getBoundingClientRect().top + window.scrollY
      const subtitle = hero.querySelector('#hero-title em').getBoundingClientRect()
      // Reference subtitle line center: y=610. The loop is anchored to this
      // content landmark, so a shorter viewport cannot leave it hanging lower.
      const loopShift = Math.min(0, (subtitle.top + subtitle.height / 2 + window.scrollY) - 610 * scale)
      const point = (x, y, shift = 0) => `${x * scale} ${y * scale - homeTop + loopShift * shift}`
      const upper = `M ${point(-20, 88)}
        C ${point(170, -74)}, ${point(390, -100)}, ${point(550, 94)}
        C ${point(680, 251.625)}, ${point(721, 444, 1)}, ${point(697, 575, 1)}
        C ${point(684.1755725, 645, 1)}, ${point(610, 755, 1)}, ${point(542, 741, 1)}
        C ${point(491, 730.5, 1)}, ${point(469, 690, 1)}, ${point(503, 647, 1)}
        C ${point(537, 604, 1)}, ${point(607, 605, 1)}, ${point(660, 657, 1)}
        C ${point(735, 730.5849056604, 1)}, ${point(780, 938, .5)}, ${point(680, 1164)}`
      const endX = 680 * scale, endY = 1164 * scale - homeTop
      // Keep the pre-loop-adjustment lower anchors, including the original
      // .23w / h-.045hh endpoint. Only its entry handle matches the raised
      // loop tangent. Append a tangent continuation beyond the document edge.
      const lower = ` C ${endX - 50 * scale} ${endY + 113 * scale - loopShift * .25}, ${.26*w} ${hh+.52*(h-hh)}, ${.18*w} ${hh+.58*(h-hh)} C ${.10*w} ${hh+.64*(h-hh)}, ${.022*w} ${hh+.60*(h-hh)}, ${.022*w} ${hh+.76*(h-hh)} C ${.022*w} ${hh+.92*(h-hh)}, ${.11*w} ${h-.02*hh}, ${.23*w} ${h-.045*hh} C ${.29*w} ${h-.0575*hh}, ${.36*w} ${canvasHeight+.02*hh}, ${.36*w} ${canvasHeight+.20*hh}`
      svg.current.setAttribute('viewBox', `0 0 ${w} ${canvasHeight}`)
      lead.current.setAttribute('d', upper)
      line.current.setAttribute('d', upper + lower)
      total = line.current.getTotalLength()
      // Start the drawing tip just inside the first viewport. Scroll must reveal
      // new visible stroke immediately, rather than drawing offscreen first.
      const tipY = innerHeight - homeTop - 80
      let low = 0, high = total
      for (let i = 0; i <= 128; i++) {
        const distance = total * i / 128
        if (line.current.getPointAtLength(distance).y <= tipY) low = distance
      }
      high = Math.min(total, low + total / 128)
      for (let i = 0; i < 18; i++) {
        const middle = (low + high) / 2
        if (line.current.getPointAtLength(middle).y <= tipY) low = middle
        else high = middle
      }
      initial = low
      line.current.style.strokeDasharray = `${total} ${total}`
      start = host.getBoundingClientRect().top + window.scrollY - (document.querySelector('.site-header')?.offsetHeight || 0)
      travel = Math.max(1, document.documentElement.scrollHeight - innerHeight - start)
      cancelAnimationFrame(frame)
      paint(performance.now(), true)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(host); observer.observe(hero)
    if (footer) observer.observe(footer)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measure)
    reduced.addEventListener('change', schedule)
    measure()
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure)
      reduced.removeEventListener('change', schedule)
    }
  }, [])
  return <div className="home-geometry" ref={root} aria-hidden="true" data-dev-text-dynamic>
    <svg className="home-geometry-curve" ref={svg} preserveAspectRatio="xMinYMin meet">
      <path ref={lead} fill="none" stroke="none" />
      <path ref={line} fill="none" stroke="#55b6cb" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
}
