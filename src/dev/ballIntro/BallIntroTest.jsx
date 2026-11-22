import { useLayoutEffect, useRef, useState } from 'react'
import BallTest from '../../components/ballTest/BallTest'
import useParallax from '../../edition/useParallax'
import { collectIntroTracks } from './introChoreography'
import { createIntroPlayback, waitForIntroAssets } from './introPlayback'
import './ballIntro.css'

export default function BallIntroTest() {
  useParallax()
  const host=useRef(null),active=useRef(null)
  const [take,setTake]=useState(0),[phase,setPhase]=useState('preparing'),[error,setError]=useState('')
  const formalUrl=`${import.meta.env.BASE_URL}?edition=favorites`
  useLayoutEffect(()=>{
    const controller=new AbortController()
    let alive=true
    const playback=createIntroPlayback({onComplete:issue=>{if(alive){setError(issue?.message??'');setPhase('complete')}}})
    const skip=()=>{controller.abort();playback.skip()}
    active.current=skip
    const preference=matchMedia('(prefers-reduced-motion: reduce)')
    const preferenceChanged=()=>{if(preference.matches)skip()}
    const visibility=()=>document.hidden?playback.pause():playback.resume()
    const resize=()=>{if(host.current?.dataset.phase==='playing')skip()}
    preference.addEventListener('change',preferenceChanged)
    document.addEventListener('visibilitychange',visibility)
    window.addEventListener('resize',resize)
    waitForIntroAssets(host.current,controller.signal).then(()=>{
      if(!alive || controller.signal.aborted)return
      const tracks=collectIntroTracks(host.current,{width:innerWidth,height:innerHeight})
      setPhase('playing')
      playback.start(tracks,{reduced:preference.matches})
      if(document.hidden)playback.pause()
    }).catch(issue=>{if(alive && issue.name!=='AbortError'){setError(issue.message);setPhase('complete')}})
    return ()=>{
      alive=false;controller.abort();playback.dispose();active.current=null
      preference.removeEventListener('change',preferenceChanged)
      document.removeEventListener('visibilitychange',visibility)
      window.removeEventListener('resize',resize)
    }
  },[take])
  const replay=()=>{setPhase('preparing');setError('');setTake(value=>value+1)}
  return <div ref={host} className="ball-intro-test site-shell codex-edition" data-edition-page="ball-test" data-phase={phase}>
    <div className="bit-live" inert={phase!=='complete'}>
      <BallTest key={take} onBack={()=>location.assign(formalUrl)}/>
    </div>
    {phase!=='complete' && <div className="bit-accents" aria-hidden="true">
      <span className="bit-seal"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="60"/><circle cx="80" cy="80" r="46"/><path d="M80 39Q86 74 121 80Q86 86 80 121Q74 86 39 80Q74 74 80 39Z"/></svg></span>
      {[['25%','32%'],['74%','36%'],['39%','65%'],['62%','23%'],['52%','72%']].map(([left,top],index)=><span key={index} className={`bit-spark bit-spark-${index}`} style={{left,top}}>✧</span>)}
    </div>}
    <nav className="bit-controls" aria-label="Ball 開場動畫測試工具">
      <span className="bit-label">BALL INTRO <i aria-hidden="true">✦</i></span>
      <span className="bit-status" role="status">{phase==='preparing'?'素材準備中':phase==='playing'?'魔法組裝中':'開場完成'}</span>
      <button type="button" onClick={replay}>↻ 重新播放</button>
      <button type="button" onClick={()=>active.current?.()} disabled={phase==='complete'}>跳過</button>
      <a href={formalUrl}>正常頁面 ↗</a>
    </nav>
    {error && <p className="bit-error" role="alert">{error}</p>}
  </div>
}
