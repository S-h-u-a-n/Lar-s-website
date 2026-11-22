import {useEffect,useState} from 'react'
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion'
import {ARTWORKS,findCollection} from '../puzzle/artworks'
import {unlocked} from '../puzzle/progress'
import PictureFrame from '../puzzle/PictureFrame'
import ArtworkDialog from '../puzzle/ArtworkDialog'
import CollectionDialog from '../puzzle/CollectionDialog'
import '../puzzle/PuzzleGallery.css'
export default function HomePuzzleGallery({selectedId,onSelect,onEnter}) {
  const [,update]=useState(0),[direction,setDirection]=useState(1),[details,setDetails]=useState(false),reduced=useReducedMotion()
  useEffect(()=>{const changed=()=>update(n=>n+1);window.addEventListener('storage',changed);window.addEventListener('genesis-puzzle-progress',changed);return()=>{window.removeEventListener('storage',changed);window.removeEventListener('genesis-puzzle-progress',changed)}},[])
  const index=Math.max(0,ARTWORKS.findIndex(a=>a.id===findCollection(selectedId).id)),art=ARTWORKS[index],done=unlocked(art)
  const enter=()=>art.items?setDetails(true):onEnter(art.id)
  const turn=d=>{setDirection(d);onSelect(ARTWORKS[(index+d+ARTWORKS.length)%ARTWORKS.length].id)}
  return <section id="home-puzzle-gallery" className="pg-gallery" aria-labelledby="pg-title" data-layout-owned="component">
    <motion.header className="pg-heading" initial={{opacity:0,y:reduced?0:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.5}} transition={{duration:.65}}><div className="pg-gallery-title"><span className="pg-eyebrow">ILLUSTRATION COLLECTION</span><h2 id="pg-title">拼圖畫廊 <small>Puzzle <em>Gallery</em></small></h2></div><div className="pg-gallery-intro"><span className="pg-gallery-seal" aria-hidden="true">✦</span><p>把散落的故事，重新拼起來！</p><small>這裡收藏著研究室裡的點點滴滴。<br/>隨機挑一副畫，慢慢拼出它原本的模樣吧！</small></div></motion.header>
    <motion.div className="pg-stage" initial={{opacity:0,y:reduced?0:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.25}} transition={{duration:.8,delay:reduced?0:.1}}><button className="pg-arrow" disabled={ARTWORKS.length<2} onClick={()=>turn(-1)} aria-label="上一幅作品"><span className="pg-arrow-icon pg-arrow-icon--left" aria-hidden="true"/></button>
      <div className="pg-display"><AnimatePresence mode="wait" custom={direction} initial={false}><motion.button key={art.id} className="pg-artwork" style={{'--image-ratio':art.width/art.height}} data-artwork={art.id} onClick={()=>art.items||done?setDetails(true):onEnter(art.id)} aria-label={`${art.title}，${art.items?'選擇拼圖':done?'已解鎖，查看作品介紹':'未完成，進入拼圖'}`} initial={reduced?{opacity:0}:{opacity:0,x:direction*65,scale:.9,rotateY:direction*12}} animate={{opacity:1,x:0,scale:1,rotateY:0}} exit={reduced?{opacity:0}:{opacity:0,x:-direction*65,scale:.9,rotateY:-direction*12}} transition={{duration:reduced?.12:.55,ease:[.22,.75,.25,1]}}><PictureFrame art={art} unlocked={done}/></motion.button></AnimatePresence></div>
      <button className="pg-arrow" disabled={ARTWORKS.length<2} onClick={()=>turn(1)} aria-label="下一幅作品"><span className="pg-arrow-icon pg-arrow-icon--right" aria-hidden="true"/></button></motion.div>
    <div className="pg-caption" aria-live="polite"><div className="pg-work-label"><span className="pg-work-number">{art.number}<small> / {String(ARTWORKS.length).padStart(2,'0')}</small></span><div><h3>{art.officialTitle||art.title}</h3><span className="pg-collection-tag"><i/>{art.items?`已完成 ${art.items.filter(unlocked).length} / ${art.items.length} · 點擊選擇拼圖`:done?'已收藏 · 點擊畫框查看作品':'尚未解鎖 · 完成拼圖後展示'}</span></div></div><button className="pg-button pg-button--peach" onClick={enter}>{art.items?'選擇拼圖':done?'再次拼圖':'進入拼圖'} ↗︎</button></div>
    <AnimatePresence>{details&&art.items&&<CollectionDialog key={art.id} art={art} onClose={()=>setDetails(false)} onPlay={id=>{setDetails(false);onEnter(id)}}/>}{details&&!art.items&&<ArtworkDialog key="details" art={art} onClose={()=>setDetails(false)} onPlay={()=>{setDetails(false);onEnter(art.id)}}/>}</AnimatePresence>
  </section>
}
