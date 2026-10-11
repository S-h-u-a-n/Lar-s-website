import { useEffect, useRef } from 'react'
// Screen-space labels track the actual camera; text never shrinks to illegibility.
export default function AtlasLabels({camera,categories,onChoose}) {
  const ref=useRef(null)
  useEffect(()=>{
    const world=camera.worldRef.current, viewport=camera.viewportRef.current
    if(!world||!viewport)return
    const update=()=>{
      const matrix=new DOMMatrixReadOnly(world.style.transform||undefined)
      ref.current?.style.setProperty('--atlas-scale',matrix.a)
      ref.current?.querySelectorAll('[data-atlas-label]').forEach((node,index)=>{
        const c=categories[index], x=matrix.e+c.x*matrix.a,y=matrix.f+c.y*matrix.a
        node.style.left=`${x}px`;node.style.top=`${y}px`
      })
    }
    const observer=new MutationObserver(update);observer.observe(world,{attributes:true,attributeFilter:['style']});update()
    return()=>observer.disconnect()
  },[camera.worldRef,camera.viewportRef,categories])
  return <div ref={ref} className={`edition-atlas-labels ${camera.level==='overview'?'is-overview':''}`} aria-hidden={camera.level!=='overview'} inert={camera.level!=='overview'}>{categories.map((category,index)=><button key={category.id} data-atlas-label style={{'--category-color':category.color}} onClick={()=>onChoose(category)}><small>0{index+1} / {category.entries.length} FIELD NOTES</small><strong>{category.name}</strong><span>打開研究區 ↗</span></button>)}</div>
}
