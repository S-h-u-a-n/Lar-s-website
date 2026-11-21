import { useLayoutEffect, useRef } from 'react'
import { HISTORY as C } from '../config'
import { avoidTitle, seeded, squareLayout, squarePose } from '../squareLayout'

const sources = Object.values(import.meta.glob('../../../../Art/IntroScreen/square/*.PNG', { eager:true, query:'?url', import:'default' }))
const baseline = C.squares.referenceViewportHeight / C.height
const exclusion = { x:C.title.x, y:C.title.y, width:C.title.width, height:C.title.fontSize*2.4+C.entryHint.gap+C.entryHint.fontSize }
const original = squareLayout(C.squares, C.width, C.height, sources.length)
const random = seeded(1907)
// Add 24 original PNGs in loose horizontal bands. Reject nearby anchors instead
// of stacking another copy of the original 30-particle arrangement.
const particles = squareLayout({...C.squares,count:24,seed:1907},C.width,C.height,sources.length).map(p => {
  for (let attempt=0;attempt<60;attempt++) {
    const x=(Math.floor(p.id/3)+.12+random()*.76)/8*C.width
    const y=(.10+random()*.80)*C.height
    const safe=avoidTitle(x,y,p.size*.72/baseline,exclusion)
    if (original.every(q=>Math.hypot((q.x-safe.x)*baseline,(q.y-safe.y)*baseline)>76)) {
      const candidate={...p,x:safe.x,y:safe.y}
      original.push(candidate)
      return candidate
    }
  }
  return null
}).filter(Boolean)

export default function ExtraSquares() {
  const layer=useRef(null)
  const nodes=useRef([])
  useLayoutEffect(()=>{
    const host=layer.current.closest('.history-viewport')
    const reduced=matchMedia('(prefers-reduced-motion: reduce)')
    let frame=0,previous=0,elapsed=0,disposed=false
    function paint(){
      const scale=Math.max(host.clientHeight/C.height,host.clientWidth/C.width)
      const camera=Number(host.dataset.camera??1)*Math.max(0,C.width*scale-host.clientWidth)
      const ready=host.dataset.opening==='complete'
      particles.forEach((p,i)=>{
        const node=nodes.current[i]
        const pose=reduced.matches?{...p}:squarePose(p,elapsed,baseline)
        const safe=avoidTitle(pose.x,pose.y,p.size*.72/baseline,exclusion)
        const x=safe.x*scale,y=safe.y*scale,size=p.size/baseline*scale
        const visible=ready&&(!reduced.matches||i%3===0)&&x+size>=camera-C.squares.overscan&&x-size<=camera+host.clientWidth+C.squares.overscan
        node.dataset.visible=String(visible)
        node.style.visibility=visible?'visible':'hidden'
        if(!visible)return
        Object.assign(node.style,{width:`${size}px`,height:`${size}px`,opacity:String(pose.opacity),transform:`translate3d(${x-size/2}px,${y-size/2}px,0) rotate(${pose.angle}deg)`})
      })
    }
    function tick(now){frame=0;if(disposed||document.hidden||reduced.matches)return;elapsed+=previous?Math.min(now-previous,32):0;previous=now;paint();start()}
    function start(){if(!disposed&&!frame&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick)}
    function refresh(){paint();start()}
    function visibility(){cancelAnimationFrame(frame);frame=0;previous=0;refresh()}
    const observer=new MutationObserver(refresh)
    observer.observe(host,{attributes:true,attributeFilter:['data-camera','data-opening']})
    const resize=new ResizeObserver(refresh);resize.observe(host)
    document.addEventListener('visibilitychange',visibility)
    reduced.addEventListener('change',visibility)
    refresh()
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility)}
  },[])
  return <div ref={layer} className="history-floating-squares history-ui-extra-squares" aria-hidden="true" style={{opacity:C.squares.opacity}}>{particles.map((p,i)=><img key={p.id} ref={node=>{nodes.current[i]=node}} src={sources[p.src]} alt="" decoding="async" fetchPriority="low" draggable="false"/>)}</div>
}
