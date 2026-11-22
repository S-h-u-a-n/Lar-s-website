import { useEffect, useRef } from 'react'
import BilingualTitle from '../components/research/BilingualTitle'
// Screen-space labels track the actual camera; text never shrinks to illegibility.
export default function AtlasLabels({camera,categories,onChoose,selectedId,renderDecoration,renderCardIcon,showOpenHint = true}) {
  const ref=useRef(null)
  useEffect(()=>{
    const world=camera.worldRef.current, viewport=camera.viewportRef.current
    if(!world||!viewport)return
    const update=()=>{
      const matrix=new DOMMatrixReadOnly(world.style.transform||undefined)
      const labels = [...(ref.current?.querySelectorAll('[data-atlas-label]') ?? [])]
      const decorations = [...(ref.current?.querySelectorAll('[data-atlas-decoration]') ?? [])]
      // Keep the last packed geometry throughout the fade-out; changing to
      // world anchors mid-transition would make the labels visibly jump.
      if (selectedId) { decorations.forEach((node, index) => { node.hidden = labels[index].hidden }); return }
      ref.current?.style.setProperty('--atlas-scale',matrix.a)
      const overview = camera.level === 'overview'
      const width = Math.min(235, Math.max(165, viewport.clientWidth * .18), (viewport.clientWidth - 64) / 3)
      labels.forEach(node => node.style.width = overview ? `${width}px` : '')
      const height = Math.max(0, ...labels.map(node => node.offsetHeight))
      const left = Math.min(...categories.map(c => c.x)), top = Math.min(...categories.map(c => c.y))
      const worldWidth = Math.max(...categories.map(c => c.x + c.width)) - left
      const worldHeight = Math.max(...categories.map(c => c.y + c.height)) - top
      const fitted = Math.min((viewport.clientWidth - 110) / worldWidth, (viewport.clientHeight - 110) / worldHeight)
      const ratio = fitted > 0 ? matrix.a / fitted : 1
      // Packing is a screen-space correction; retain the camera's pan/zoom.
      const panX = matrix.e - (viewport.clientWidth / 2 - (left + worldWidth / 2) * matrix.a)
      const panY = matrix.f - (viewport.clientHeight / 2 - (top + worldHeight / 2) * matrix.a)
      labels.forEach((node,index)=>{
        const c=categories[index], x=matrix.e+c.x*matrix.a,y=matrix.f+c.y*matrix.a
        const column = index % 3, row = Math.floor(index / 3)
        node.style.left=`${overview ? viewport.clientWidth / 2 + (column - 1) * (width + 16) * ratio - width / 2 + row * 6 + panX : x}px`
        node.style.top=`${overview ? viewport.clientHeight / 2 + (row - .5) * (height + 28) * ratio - height / 2 + [5,0,8][column] + panY : y}px`
      })
      decorations.forEach((node, index) => {
        const label = labels[index]
        node.style.left = label.style.left; node.style.top = label.style.top
        node.style.width = `${label.offsetWidth}px`; node.style.height = `${label.offsetHeight}px`
        node.hidden = label.hidden
      })
    }
    let hoverFrame, hoverUntil = 0
    const followHover = () => {
      const labels = ref.current?.querySelectorAll('[data-atlas-label]') ?? []
      const decorations = ref.current?.querySelectorAll('[data-atlas-decoration]') ?? []
      decorations.forEach((node, index) => { node.style.transform = getComputedStyle(labels[index]).transform })
      if (performance.now() < hoverUntil) hoverFrame = requestAnimationFrame(followHover)
    }
    const hover = () => { hoverUntil = performance.now() + 400; cancelAnimationFrame(hoverFrame); followHover() }
    const root = ref.current
    root.addEventListener('pointerover', hover); root.addEventListener('pointerout', hover)
    const observer=new MutationObserver(update);observer.observe(world,{attributes:true,attributeFilter:['style']});const resize=new ResizeObserver(update);resize.observe(viewport);update();document.fonts.ready.then(update)
    return()=>{observer.disconnect();resize.disconnect();cancelAnimationFrame(hoverFrame);root.removeEventListener('pointerover',hover);root.removeEventListener('pointerout',hover)}
  },[camera.worldRef,camera.viewportRef,camera.level,categories,selectedId])
  return <div ref={ref} className={`edition-atlas-labels ${camera.level==='overview' && !selectedId?'is-overview':''}`} aria-hidden={camera.level!=='overview' || Boolean(selectedId)} inert={camera.level!=='overview' || Boolean(selectedId)}>{categories.map((category,index)=><button key={category.id} hidden={selectedId === category.id} data-atlas-label style={{'--category-color':category.color}} onClick={()=>onChoose(category)}>{renderCardIcon?.(category)}<small>0{index+1} / {category.entries.length} FIELD NOTES</small><strong><BilingualTitle chinese={category.chineseName} english={category.name}/></strong>{showOpenHint && <span>打開研究區 ↗︎</span>}</button>)}{renderDecoration && <div className="atlas-decoration-layer" aria-hidden="true">{categories.map(category => <div key={category.id} data-atlas-decoration>{renderDecoration(category)}</div>)}</div>}</div>
}
