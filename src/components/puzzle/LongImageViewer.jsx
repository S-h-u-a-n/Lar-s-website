import {useEffect,useRef,useState} from 'react'

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value))

export default function LongImageViewer({src,onClose}) {
  const ref=useRef(null)
  const [zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),[error,setError]=useState(false)
  const drag=useRef(null)

  useEffect(()=>{const dialog=ref.current;dialog.showModal();dialog.querySelector('button')?.focus({preventScroll:true});return()=>dialog.close()},[])

  function startDrag(e){
    if(e.button!==0)return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current={id:e.pointerId,x:e.clientX,y:e.clientY}
  }
  function moveDrag(e){
    if(drag.current?.id!==e.pointerId)return
    const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y
    drag.current={...drag.current,x:e.clientX,y:e.clientY}
    setPan(point=>({x:point.x+dx,y:point.y+dy}))
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
    <div className="pg-long-viewer-viewport" onWheel={wheel} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}}>
      {error?<p role="alert">完整長圖載入失敗，請關閉後再試。</p>:<img src={src} alt="運命完整長圖" draggable="false" onError={()=>setError(true)} style={{transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}}/>}
    </div>
    <p className="pg-long-viewer-hint">滾輪縮放 · 拖曳移動</p>
  </dialog>
}
