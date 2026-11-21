import { useLayoutEffect, useRef } from 'react'
import { HISTORY as C, ASSETS } from '../../../dev/history/config'
import { spring, clamp } from '../../../dev/history/interactionMath'

// Reuse only the intro interaction springs; the Home strip has no entrance playback.
export default function useArchiveMotion({ viewport, buttons, state, hover, records }) {
  const api = useRef({ pose: () => null, wake() {}, pointer() {}, leave() {} })
  useLayoutEffect(() => {
    const host = viewport.current, reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const locals = records.map(() => ({ scale:{value:1,velocity:0}, angle:{value:0,velocity:0}, tilt:{value:0,velocity:0}, lastTrigger:-Infinity, sway:0, velocity:0, pitch:0, pitchVelocity:0 }))
    const poses=[]
    let frame=0, previous=0, visible=false, disposed=false, inputX=0,inputY=0,lastPointer=null,lastScroll=host.scrollLeft,lastWheel=-Infinity,lastHover=-1
    function request(){ if(!frame && visible && !disposed) frame=requestAnimationFrame(paint) }
    function paint(time) {
      frame=0
      if(!visible || disposed)return
      const dt=previous?Math.min(.032,(time-previous)/1000):1/60;previous=time
      // Hold the exact source pose while its matching figure travels to/from details.
      if(state.current.selection){previous=0;return}
      let moving=false
      const {layout}=state.current
      const selected= time-lastWheel<C.hover.scrollQuietMs ? -1 : hover.current
      if(selected!==lastHover && selected>=0 && !reduced.matches){
        const s=locals[selected]
        if(time-s.lastTrigger>=C.hover.cooldownMs){
          s.angle.velocity+=(lastPointer?.dx ? Math.sign(lastPointer.dx):1)*C.hover.push
          s.tilt.velocity+=Math.sign(lastPointer?.dy||0)*C.hover.push*.45
          s.lastTrigger=time
        }
      }
      lastHover=selected
      layout.items.forEach((item,index)=>{
        const s=locals[index], m=C.motion, assetIndex=ASSETS.findIndex(a=>a.id===records[index].id)
        const variation=.85+(assetIndex%5)*.065
        if(!reduced.matches){
          s.velocity+=inputX*m.impulse*variation;s.pitchVelocity+=inputY*m.impulse*variation
          s.velocity+=(-m.stiffness*s.sway-m.damping*s.velocity)*dt
          s.pitchVelocity+=(-m.stiffness*s.pitch-m.damping*s.pitchVelocity)*dt
          s.sway=clamp(s.sway+s.velocity*dt,-m.maxAngle,m.maxAngle)
          s.pitch=clamp(s.pitch+s.pitchVelocity*dt,-m.maxAngle,m.maxAngle)
        }else{s.sway=s.velocity=s.pitch=s.pitchVelocity=0}
        const active=Math.abs(s.sway)+Math.abs(s.velocity)+Math.abs(s.pitch)+Math.abs(s.pitchVelocity)>.003
        if(!active)s.sway=s.velocity=s.pitch=s.pitchVelocity=0
        moving ||= active
        const isSelected=index===selected
        const scaleMoving=spring(s.scale,isSelected?C.hover.scale:1,dt,C.hover.scaleStiffness,C.hover.scaleDamping)
        const angleMoving=spring(s.angle,0,dt,C.hover.stiffness,C.hover.damping)
        const tiltMoving=spring(s.tilt,0,dt,C.hover.stiffness,C.hover.damping)
        if(reduced.matches){s.scale.value=isSelected?C.hover.scale:1;s.scale.velocity=s.angle.value=s.angle.velocity=s.tilt.value=s.tilt.velocity=0}
        moving ||= !reduced.matches&&(scaleMoving||angleMoving||tiltMoving)
        const rotateZ=clamp(s.sway+s.angle.value,-C.hover.maxAngle,C.hover.maxAngle)
        const rotateX=clamp(s.pitch*m.verticalAngle+s.tilt.value,-C.hover.maxTilt,C.hover.maxTilt)
        const scale=s.scale.value
        const perspective=2600*(layout.scale||.28),origin=records[index].interaction.foot
        buttons.current[index].style.transform=`perspective(${perspective}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale})`
        buttons.current[index].parentElement.parentElement.style.zIndex=isSelected?'3':scale>1.001?'2':'1'
        poses[index]={...item,origin,entryY:0,rotateX,rotateZ,scale,perspective,entered:true}
      })
      inputX=inputY=0
      if(moving)request()
    }
    const scroll=()=>{
      const delta=host.scrollLeft-lastScroll;lastScroll=host.scrollLeft
      if(performance.now()-lastWheel>50)inputX+=clamp(-delta,-120,120);request()
    }
    const wheel=event=>{
      const unit=event.deltaMode===1?C.scroll.linePixels:event.deltaMode===2?host.clientHeight:1
      const dx=event.deltaX*unit,dy=event.deltaY*unit
      inputX+=clamp(dx||-dy,-120,120);inputY+=clamp(dy,-120,120)
      lastWheel=performance.now();request()
    }
    host.addEventListener('wheel',wheel,{passive:true})
    // Visibility pauses idle/offscreen work only; it never starts an actor animation.
    const observer=new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;previous=0
      if(visible)request()
      else{cancelAnimationFrame(frame);frame=0}
    },{threshold:.01})
    observer.observe(host)
    const preference=()=>request()
    host.addEventListener('scroll',scroll,{passive:true});reduced.addEventListener('change',preference)
    api.current={pose:index=>poses[index],wake:request,pointer(event){
      if(lastPointer){const dx=event.clientX-lastPointer.x,dy=event.clientY-lastPointer.y;inputX+=clamp(dx,-80,80)*C.motion.pointerGain;inputY+=clamp(dy,-80,80)*C.motion.pointerGain;lastPointer={x:event.clientX,y:event.clientY,dx,dy}}
      else lastPointer={x:event.clientX,y:event.clientY,dx:0,dy:0}
      request()
    },leave(){lastPointer=null;request()}}
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();host.removeEventListener('scroll',scroll);host.removeEventListener('wheel',wheel);reduced.removeEventListener('change',preference)}
  },[viewport,buttons,state,hover,records])
  return api
}
