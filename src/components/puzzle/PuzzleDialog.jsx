import {useEffect,useRef} from 'react'
import {motion,useIsPresent,useReducedMotion} from 'framer-motion'
export default function PuzzleDialog({label,children,onClose,wide=false,layout='standard'}) {
  const ref=useRef(null),present=useIsPresent(),reduced=useReducedMotion()
  useEffect(()=>{const previous=document.activeElement,el=ref.current;el.showModal();el.querySelector('button')?.focus({preventScroll:true});return()=>{el.close();if(previous?.isConnected)previous.focus({preventScroll:true})}},[])
  const transition={duration:reduced?.1:.65,ease:[.22,1,.36,1]}
  return <dialog ref={ref} className={`pg-dialog ${wide?'pg-dialog--art':''} ${wide?`pg-dialog--art-${layout}`:''}`} aria-label={label} onCancel={e=>{e.preventDefault();if(present)onClose()}}>
    <motion.div className="pg-dialog-scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={transition} onClick={()=>present&&onClose()}/>
    <motion.section className="pg-dialog-paper" inert={!present} initial={{opacity:0,y:reduced?0:28,scale:reduced?1:.985}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:reduced?0:12,scale:reduced?1:.985}} transition={transition}>{children}</motion.section>
  </dialog>
}
