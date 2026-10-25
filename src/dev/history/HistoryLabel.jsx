import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { HISTORY_LABELS, LABEL_STYLE as S } from './labels'
import { labelPosition } from './labelPosition'
import './historyLabel.css'

export default forwardRef(function HistoryLabel(_, ref) {
  const host=useRef(null),paper=useRef(null),name=useRef(null),date=useRef(null),engine=useRef(null)
  useImperativeHandle(ref,()=>({update:snapshot=>engine.current?.update(snapshot)}),[])
  useLayoutEffect(()=>{
    let active='',animation=null,last=null,size={width:0,height:0}
    function move(){if(!last||!active)return
      const position=labelPosition(last.anchor,size,last.viewport,S)
      host.current.style.transform=`translate(${position.x}px,${position.y}px)`
      host.current.dataset.side=position.side
    }
    function fade(show,reduced){
      const node=paper.current,style=getComputedStyle(node)
      const from={opacity:style.opacity,transform:style.transform}
      animation?.cancel()
      node.style.opacity=show?'1':'0';node.style.transform=show?'translateY(0px)':`translateY(${S.rise}px)`
      if(!reduced)animation=node.animate([show?{opacity:0,transform:`translateY(${S.rise}px)`}:from,{opacity:show?1:0,transform:show?'translateY(0px)':`translateY(${S.rise}px)`}],{duration:show?S.fadeInMs:S.fadeOutMs,easing:'cubic-bezier(.22,1,.36,1)'})
    }
    engine.current={update(snapshot){
      last=snapshot
      const id=snapshot?.id&&HISTORY_LABELS[snapshot.id]?snapshot.id:''
      if(id!==active){active=id;host.current.dataset.labelAsset=id;host.current.setAttribute('aria-hidden',String(!id))
        if(id){[name.current.textContent,date.current.textContent]=HISTORY_LABELS[id];size={width:paper.current.offsetWidth,height:paper.current.offsetHeight}}
        fade(Boolean(id),snapshot?.reduced)
      }
      move()
    }}
    const observer=new ResizeObserver(()=>{if(!active)return;size={width:paper.current.offsetWidth,height:paper.current.offsetHeight};move()})
    observer.observe(paper.current)
    return()=>{engine.current=null;observer.disconnect();animation?.cancel()}
  },[])
  return <div ref={host} className="history-label" role="tooltip" aria-hidden="true" data-label-asset="">
    <div ref={paper} className="history-label-paper"><span ref={name} className="history-label-name"/><span ref={date} className="history-label-date"/></div>
  </div>
})
