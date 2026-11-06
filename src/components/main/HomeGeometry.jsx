import { useLayoutEffect, useRef } from 'react'
import { createScrollPathMap } from './scrollPathMap'

export default function HomeGeometry() {
  const root = useRef(null), svg = useRef(null), line = useRef(null), lead = useRef(null)
  useLayoutEffect(() => {
    const host = root.current.parentElement
    const hero = host.querySelector('.edition-hero')
    const footer = host.parentElement.querySelector('.site-footer')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame=0,total=1,homeTop=0,mapHeight=()=>0
    const paint = () => {
      frame=0
      const targetY=window.scrollY-homeTop+innerHeight*.82
      const drawn=reduced.matches?total:mapHeight(targetY)
      line.current.style.strokeDashoffset=String(total-drawn)
      const tip=line.current.getPointAtLength(drawn)
      root.current.dataset.drawMapped=(drawn/total).toFixed(4)
      root.current.dataset.tipX=tip.x.toFixed(1)
      root.current.dataset.tipY=(tip.y+homeTop-window.scrollY).toFixed(1)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    const measure = () => {
      const history = host.querySelector('#home-history')
      const characters = host.querySelector('#home-characters')
      const wishbox = host.querySelector('#wishbox')
      const author = host.querySelector('#home-author')
      const w = host.clientWidth, fullHeight = host.offsetHeight, hh = hero.offsetHeight
      // Preserve every pre-existing Hero/Explore anchor. The added section
      // extends the path instead of stretching the old composition.
      const h = history?.offsetTop || characters?.offsetTop || fullHeight
      const canvasHeight = fullHeight + (footer?.offsetHeight || 0)
      root.current.style.height = `${canvasHeight}px`
      root.current.style.bottom = 'auto'
      // Trace coordinates measured in the 2048 × 1164 reference image.
      // One isotropic scale preserves the ellipse and bending radii; subtract
      // Home's document offset because the reference includes the header.
      const scale = w / 2048
      homeTop = host.getBoundingClientRect().top + window.scrollY
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
      const lower = ` C ${endX - 50 * scale} ${endY + 113 * scale - loopShift * .25}, ${.26*w} ${hh+.52*(h-hh)}, ${.18*w} ${hh+.58*(h-hh)} C ${.10*w} ${hh+.64*(h-hh)}, ${.022*w} ${hh+.60*(h-hh)}, ${.022*w} ${hh+.76*(h-hh)} C ${.022*w} ${hh+.92*(h-hh)}, ${.11*w} ${h-.02*hh}, ${.23*w} ${h-.045*hh}`
      const characterEnd = wishbox?.offsetTop || fullHeight
      const cs = characters?.offsetTop || h
      const ch = characterEnd - cs
      const historyHeight = cs - h
      // Insert a margin-side bridge without stretching the existing Explore
      // curve or the portrait loop. The interactive strip remains unobscured.
      const historyBridge = history
        ? ` C ${.29*w} ${h-.0575*hh}, ${.03*w} ${h+.08*historyHeight}, ${.025*w} ${h+.22*historyHeight}
            C ${.015*w} ${h+.55*historyHeight}, ${.04*w} ${h+.85*historyHeight}, ${.18*w} ${cs-.045*hh}
            C ${.20*w} ${cs-.047*hh}, ${.22*w} ${cs-.043*hh}, ${.23*w} ${cs-.045*hh}` : '' 
      // A single continuous stroke loops behind the portrait collection, then
      // passes into the footer. It uses the same scroll-driven drawing loop.
      const continuation = characters
        ? ` C ${.29*w} ${cs-.0575*hh}, ${.39*w} ${cs+.02*ch}, ${.43*w} ${cs+.18*ch}
            C ${.52*w} ${cs+.54*ch}, ${.25*w} ${cs+.88*ch}, ${.07*w} ${cs+.65*ch}
            C ${-.025*w} ${cs+.48*ch}, ${.025*w} ${cs+.23*ch}, ${.12*w} ${cs+.25*ch}
            C ${.25*w} ${cs+.28*ch}, ${.10*w} ${cs+.90*ch}, ${.28*w} ${cs+.96*ch}`
        : ` C ${.29*w} ${cs-.0575*hh}, ${.36*w} ${canvasHeight+.02*hh}, ${.36*w} ${canvasHeight+.20*hh}`
      const wishEnd = author?.offsetTop || fullHeight
      const wh = wishEnd - characterEnd
      const terminal = author?.querySelector('.ha-thread-end')?.getBoundingClientRect()
      const terminalX = terminal ? terminal.left + terminal.width / 2 : .36*w
      const terminalY = terminal ? terminal.top + terminal.height / 2 + window.scrollY - homeTop : canvasHeight+.20*hh
      const authorTail = author && terminal
        ? ` C ${.34*w} ${wishEnd+.11*author.offsetHeight}, ${terminalX-72} ${terminalY-60}, ${terminalX} ${terminalY}`
        : ` C ${.34*w} ${canvasHeight+.04*hh}, ${.36*w} ${canvasHeight+.12*hh}, ${.36*w} ${canvasHeight+.20*hh}`
      // Keep the portrait loop's original anchors. Beyond it, the same stroke
      // takes a quiet detour left of the letter. End at the author's small seal,
      // leaving future credits/footer content independent of this path's anchors.
      const ending = wishbox
        ? ` C ${.37*w} ${cs+.99*ch}, ${.43*w} ${characterEnd+.04*wh}, ${.30*w} ${characterEnd+.18*wh}
            C ${.18*w} ${characterEnd+.33*wh}, ${.12*w} ${characterEnd+.50*wh}, ${.15*w} ${characterEnd+.73*wh}
            C ${.17*w} ${characterEnd+.91*wh}, ${.28*w} ${wishEnd-.03*wh}, ${.31*w} ${wishEnd+.02*hh}
            ${authorTail}`
        : characters ? ` C ${.37*w} ${cs+.99*ch}, ${.43*w} ${canvasHeight+.02*hh}, ${.43*w} ${canvasHeight+.20*hh}` : ''
      svg.current.setAttribute('viewBox', `0 0 ${w} ${canvasHeight}`)
      lead.current.setAttribute('d', upper)
      line.current.setAttribute('d', upper + lower + historyBridge + continuation + ending)
      total = line.current.getTotalLength()
      // Rebuild from the actual responsive path, including all current sections.
      const samples=Array.from({length:769},(_,index)=>{
        const length=total*index/768
        return {length,y:line.current.getPointAtLength(length).y}
      })
      mapHeight=createScrollPathMap(samples)
      line.current.style.strokeDasharray=`${total} ${total}`
      cancelAnimationFrame(frame)
      paint()
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
