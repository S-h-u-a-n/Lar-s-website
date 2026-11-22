import {useEffect,useRef,useState} from 'react'

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value))

export default function LongImageViewer({src,onClose}) {
  const ref=useRef(null)
  const [zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),[error,setError]=useState(false)
  const drag=useRef(null),pointers=useRef(new Map()),pinch=useRef(null)

  useEffect(()=>{const dialog=ref.current;dialog.showModal();dialog.querySelector('button')?.focus({preventScroll:true});return()=>dialog.close()},[])

  function startDrag(e){
    if(e.button!==0)return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    if(pointers.current.size===2){
      drag.current=null
      const [a,b]=[...pointers.current.values()]
      pinch.current={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
      return
    }
    drag.current={id:e.pointerId,x:e.clientX,y:e.clientY}
  }
  function moveDrag(e){
    if(pointers.current.has(e.pointerId))pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    if(pinch.current&&pointers.current.size===2){
      const [a,b]=[...pointers.current.values()],center={x:(a.x+b.x)/2,y:(a.y+b.y)/2}
      const currentPinch=pinch.current
      setPan(point=>({x:point.x+center.x-currentPinch.center.x,y:point.y+center.y-currentPinch.center.y}))
      setZoom(clamp(currentPinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(8,currentPinch.distance),.5,5))
      pinch.current={...currentPinch,center}
      return
    }
    if(drag.current?.id!==e.pointerId)return
    const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y
    drag.current={...drag.current,x:e.clientX,y:e.clientY}
    setPan(point=>({x:point.x+dx,y:point.y+dy}))
  }
  function endDrag(e){
    pointers.current.delete(e.pointerId)
    if(drag.current?.id===e.pointerId)drag.current=null
    if(pinch.current&&pointers.current.size<2){
      pinch.current=null
      const remaining=[...pointers.current.entries()][0]
      drag.current=remaining?{id:remaining[0],...remaining[1]}:null
    }
  }
  function zoomBy(amount){setZoom(value=>clamp(value+amount,.5,5))}
  function wheel(e){e.preventDefault();setZoom(value=>clamp(value*Math.exp(-e.deltaY*.001),.5,5))}

  return <dialog ref={ref} className="pg-long-viewer" aria-label="欣賞《運命》完整長圖" onCancel={e=>{e.preventDefault();onClose()}}>
    <header className="pg-long-viewer-header"><h2>運命｜完整長圖</h2><div className="pg-long-viewer-controls">
      <button className="pg-button" onClick={()=>zoomBy(-.25)} aria-label="縮小">−</button>
      <span>{Math.round(zoom*100)}%</span>
      <button className="pg-button" onClick={()=>zoomBy(.25)} aria-label="放大">＋</button>
      <button className="pg-button" onClick={()=>{setZoom(1);setPan({x:0,y:0})}}>適合視窗</button>
      <button className="pg-close" onClick={onClose} aria-label="關閉完整長圖檢視">返回介紹 ×</button>
    </div></header>
    <div className="pg-long-viewer-viewport" onWheel={wheel} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      {error?<p role="alert">完整長圖載入失敗，請關閉後再試。</p>:<img src={src} alt="運命完整長圖" draggable="false" onError={()=>setError(true)} style={{transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}}/>}
    </div>
    <p className="pg-long-viewer-hint">滾輪／雙指縮放 · 拖曳移動</p>
  </dialog>
}
