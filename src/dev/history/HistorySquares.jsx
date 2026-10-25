import React, { forwardRef, useLayoutEffect, useImperativeHandle, useRef } from 'react'
import { HISTORY as C } from './config'
import { avoidTitle, squareLayout, squarePose } from './squareLayout'
import './historySquares.css'

const sources = Object.values(import.meta.glob('../../../Art/IntroScreen/square/*.PNG', { eager: true, query: '?url', import: 'default' }))
const particles = squareLayout(C.squares, C.width, C.height, sources.length)
export default forwardRef(function HistorySquares(_, ref) {
  const nodes = useRef([]), engine = useRef(null)
  useImperativeHandle(ref, () => ({ update: geometry => engine.current?.update(geometry) }), [])
  // Synchronous cleanup prevents a last RAF painting detached image refs.
  useLayoutEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let geometry = null, frame = 0, previous = 0, elapsed = 0, disposed = false
    const baseline = C.squares.referenceViewportHeight / C.height
    // Reserve the original title area, controls and subtitle; no square over text.
    const exclusion = { x:C.title.x, y:C.title.y, width:C.title.width, height:C.title.fontSize*2.4+C.entryHint.gap+C.entryHint.fontSize }
    function paint() {
      if (!geometry) return
      const g = geometry
      particles.forEach((p, i) => {
        const node = nodes.current[i]
        const pose = reduced.matches ? { x:p.x,y:p.y,angle:p.angle,opacity:p.opacity } : squarePose(p,elapsed,baseline)
        const radius = p.size*.72/baseline
        const safe = avoidTitle(pose.x,pose.y,radius,exclusion)
        const x = safe.x*g.scale, y = safe.y*g.scale, size = p.size/baseline*g.scale
        const selected = !reduced.matches || i % Math.ceil(C.squares.count/C.squares.reducedCount) === 0
        const visible = selected && x+size >= g.cameraPx-C.squares.overscan && x-size <= g.cameraPx+g.viewportWidth+C.squares.overscan
        const status = visible ? 'true' : 'false'
        if(node.dataset.visible !== status) { node.dataset.visible=status; node.style.visibility=visible?'visible':'hidden' }
        if(!visible) return
        node.style.width = `${size}px`; node.style.height = `${size}px`
        node.style.opacity = String(pose.opacity)
        node.style.transform = `translate3d(${x-size/2}px,${y-size/2}px,0) rotate(${pose.angle}deg)`
      })
    }
    function tick(now) {
      frame=0
      if(disposed||document.hidden||reduced.matches||!geometry) return
      const dt=previous?Math.min(now-previous,32):0
      previous=now; elapsed+=dt; paint(); start()
    }
    function start() { if(!disposed&&!frame&&!document.hidden&&!reduced.matches&&geometry) frame=requestAnimationFrame(tick) }
    function visibility() { previous=0; if(document.hidden){cancelAnimationFrame(frame);frame=0}else start() }
    function preference() { cancelAnimationFrame(frame);frame=0;previous=0;paint();start() }
    engine.current={update(next){geometry=next;paint();start()}}
    document.addEventListener('visibilitychange',visibility)
    reduced.addEventListener('change',preference)
    return()=>{disposed=true;cancelAnimationFrame(frame);engine.current=null;document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference)}
  },[])
  return <div className="history-floating-squares" aria-hidden="true" style={{opacity:C.squares.opacity}}>
    {particles.map(p=><img key={p.id} ref={node=>{nodes.current[p.id]=node}} data-square={p.id} src={sources[p.src]} alt="" decoding="async" fetchPriority="low" draggable="false"/>)}
  </div>
})
