import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { TOOLS, DESK_OBJECTS, pageName } from './config'
export default function EditionChrome({screen,onNavigate,onTool,visited=[],onClosePaper,paperOpen,busy,openSignal,sceneReady}) {
  const [open,setOpen]=useState(false), button=useRef(null), drawer=useRef(null), paperButton=useRef(null), reduced=useReducedMotion()
  useEffect(()=>{setOpen(false)},[screen])
  useEffect(()=>{if(openSignal)setOpen(true)},[openSignal])
  useEffect(()=>{
    if(!open)return
    drawer.current?.querySelector('button')?.focus()
    const key=e=>{if(e.key==='Escape')setOpen(false);if(e.key==='Tab'){const items=[...drawer.current.querySelectorAll('button')];const a=items[0],b=items.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}}}
    window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);button.current?.focus({preventScroll:true})}
  },[open])
  useEffect(()=>{
    if(!paperOpen)return
    const active=document.activeElement
    const previous=active?.closest('details')?.querySelector('summary') || active
    paperButton.current?.focus({preventScroll:true})
    return()=>{if(previous?.isConnected)previous.focus({preventScroll:true})}
  },[paperOpen])
  const choose = tool=>{setOpen(false);onTool(tool.id)}
  const lab=['scene','big-test'].includes(screen)
  return <>
    {lab&&<aside inert={paperOpen} className={`edition-lab-index ${paperOpen?'is-inspecting':''}`}><p className="edition-kicker">FIELD STATION / 00</p><h2>創世<br/><em>研究室。</em></h2><p className="edition-lab-description">桌上每一件工具，<br/>都是另一種觀看世界的方法。</p><nav aria-label="研究室工具">{TOOLS.map(tool=><button key={tool.id} onClick={()=>choose(tool)} disabled={busy} style={{'--tool-color':tool.color}}><img src={tool.icon} alt=""/><span><small>{tool.number} / {tool.english}</small><strong>{tool.name}</strong></span><i aria-label={visited.includes(tool.id)?'已探索':'尚未探索'}>{visited.includes(tool.id)?'●':'↗'}</i></button>)}</nav><p className="edition-lab-instruction">拖曳旋轉研究桌 · 點選物件閱讀</p></aside>}
    {lab&&<aside inert={paperOpen} className={`edition-lab-documents ${paperOpen?'is-inspecting':''}`}><p>FROM THE DESK</p>{[['letter','來信'],['diary','研究日誌'],['notes','散落的筆記']].map(([id,name])=><button key={id} onClick={()=>window.dispatchEvent(new CustomEvent('edition-open-document',{detail:{id}}))} disabled={busy}>{name}<span>↗</span></button>)}<details className="edition-object-list"><summary>桌邊小物 ＋</summary><div><small>ON THE DESK</small>{DESK_OBJECTS.map(([id,name])=><button key={id} disabled={busy || !sceneReady} onClick={event=>{event.currentTarget.closest('details').open=false;window.dispatchEvent(new CustomEvent('edition-inspect-object',{detail:{id}}))}}>{name}<span>↗</span></button>)}</div></details></aside>}
    {paperOpen&&<button ref={paperButton} className="edition-paper-close" onClick={onClosePaper}>↙ 放回研究桌</button>}
    {screen==='comic'&&<div className="edition-story-tools"><span>序章 / 創世故事</span><button disabled={busy} onClick={()=>onNavigate('home')}>前往世界封面 ↗</button><small>點畫面或按空白鍵，翻到下一段</small></div>}
    {screen!=='intro'&&screen!=='transitioning'&&<div className="edition-navigation"><span>{pageName(screen)}</span><button ref={button} onClick={()=>setOpen(true)} disabled={busy} aria-haspopup="dialog" aria-expanded={open}>研究索引 <b>＋</b></button></div>}
    <div className="edition-index-host" inert={!open} style={{pointerEvents:open?'auto':'none'}}><AnimatePresence>{open&&<motion.div className="edition-index-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.2}}>
      <button className="edition-index-backdrop" aria-label="關閉研究索引" onClick={()=>setOpen(false)}/>
      <motion.aside key="research-index" ref={drawer} className="edition-index" role="dialog" aria-modal="true" aria-labelledby="edition-index-title" initial={{x:reduced?0:'100%',rotate:reduced?0:3}} animate={{x:0,rotate:0}} exit={{x:reduced?0:'100%',rotate:reduced?0:3}} transition={{duration:reduced?0:.5,ease:[.22,.75,.25,1]}}>
        <header><p className="edition-kicker">THE WIZARD'S GENESIS</p><button onClick={()=>setOpen(false)}>收起 ×</button></header><h2 id="edition-index-title">研究手冊<br/><em>Index of wonders.</em></h2>
        <p>選一件工具，跟著好奇心出發。</p>
        {TOOLS.map((tool,index)=><motion.button initial={reduced?false:{opacity:0,x:18,rotate:2}} animate={{opacity:1,x:0,rotate:0}} transition={{duration:.3,delay:reduced?0:.08+index*.045,ease:[.22,.75,.25,1]}} className="edition-index-tool" key={tool.id} style={{'--tool-color':tool.color}} onClick={()=>choose(tool)}><img src={tool.icon} alt=""/><span><small>{tool.number} / {tool.english}</small><strong>{tool.name}</strong><p>{tool.question}</p></span><b>↗</b></motion.button>)}
        <footer><button onClick={()=>{setOpen(false);onNavigate('home')}}>世界封面</button><button onClick={()=>{setOpen(false);onNavigate('scene')}}>研究室</button><button onClick={()=>{setOpen(false);onNavigate('comic')}}>重讀創世故事</button></footer>
        <small className="edition-imprint">CODEX EDITION · AN INDEPENDENT DESIGN EXPERIMENT</small>
      </motion.aside>
    </motion.div>}</AnimatePresence></div>
  </>
}
