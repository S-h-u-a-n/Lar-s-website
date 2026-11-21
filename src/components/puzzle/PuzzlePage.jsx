import {useCallback,useEffect,useRef,useState} from 'react'
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion'
import {findArtwork} from './artworks'
import {createPuzzle,isSolved,scatterLoose} from './engine'
import {loadProgress,saveProgress,lastDifficulty,rememberDifficulty} from './progress'
import usePuzzleTable from './usePuzzleTable'
import PuzzleDialog from './PuzzleDialog'
import ArtworkDialog from './ArtworkDialog'
import './PuzzleGallery.css'
function initialModel(art,target){const m=loadProgress(art,target);if(!m.hasSaved&&window.innerWidth<700)scatterLoose(m,{width:window.innerWidth,height:window.innerHeight});return m}
export default function PuzzlePage({artworkId,onBack}) {
  const art=findArtwork(artworkId),reduced=useReducedMotion()
  const [target,setTarget]=useState(()=>lastDifficulty(art)),[model,setModel]=useState(()=>initialModel(art,lastDifficulty(art))),[texture,setTexture]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState('拖曳拼片，放開時接合或定位。'),[saved,setSaved]=useState(''),[preview,setPreview]=useState(false),[confirm,setConfirm]=useState(null),[details,setDetails]=useState(false),[celebrating,setCelebrating]=useState(false),[,refresh]=useState(0),[changing,setChanging]=useState(false)
  const mounted=useRef(true),timer=useRef(null),changeTimer=useRef(null),modelRef=useRef(model),targetRef=useRef(target)
  modelRef.current=model;targetRef.current=target
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;clearTimeout(timer.current);clearTimeout(changeTimer.current)}},[])
  useEffect(()=>{let alive=true;setError('');setTexture(null);const img=new Image();img.onload=()=>{if(!alive)return;const c=document.createElement('canvas'),factor=Math.min(1,2560/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.round(img.naturalWidth*factor);c.height=Math.round(img.naturalHeight*factor);c.getContext('2d').drawImage(img,0,0,c.width,c.height);setTexture(c)};img.onerror=()=>alive&&setError('圖片載入失敗，請重新整理再試。');img.src=art.src;return()=>{alive=false;img.onload=null;img.onerror=null}},[art])
  const persist=useCallback(()=>{const ok=saveProgress(art,targetRef.current,modelRef.current);setSaved(ok?'已保存':'無法保存，請勿關閉頁面');refresh(n=>n+1)},[art])
  const complete=useCallback(()=>{setCelebrating(true);setMessage('拼圖完成！');clearTimeout(timer.current);timer.current=setTimeout(()=>{if(mounted.current)setDetails(true)},(reduced?0:900)+2000)},[reduced])
  const table=usePuzzleTable({model,image:texture,reduced,onCommit:persist,onMessage:setMessage,onSolved:complete})
  const solved=isSolved(model),placed=model.positions.filter(p=>p.locked).length
  const openDetails=()=>{clearTimeout(timer.current);setDetails(true)}
  function requestChange(next){table.api.current.finish?.();persist();setConfirm({kind:'difficulty',next})}
  function applyChange(){const pending=confirm;setConfirm(null);if(!pending)return;clearTimeout(timer.current);setChanging(true);setPreview(false);setCelebrating(false)
    changeTimer.current=setTimeout(()=>{if(!mounted.current)return;const next=pending.kind==='reset'?target:pending.next,m=pending.kind==='reset'?createPuzzle(art.width,art.height,next):initialModel(art,next);if(pending.kind==='reset'&&innerWidth<700)scatterLoose(m,{width:innerWidth,height:innerHeight});setModel(m);setTarget(next);rememberDifficulty(art,next);setMessage('拖曳拼片，放開時接合或定位。');setSaved('');setChanging(false);if(pending.kind==='reset')saveProgress(art,next,m)},reduced?0:180)
  }
  function back(){clearTimeout(timer.current);table.api.current.finish?.();persist();onBack()}
  const duration=reduced?0:.45
  const options=[...art.difficulties,...(art.legacyDifficulties||[]).filter(t=>loadProgress(art,t).hasSaved)]
  return <main className={`pg-game ${celebrating?'is-celebrating':''}`} data-layout-owned="component" aria-labelledby="puzzle-title">
    <motion.header className="pg-game-header" initial={{opacity:0,y:reduced?0:-10}} animate={{opacity:1,y:0}} transition={{duration}}>
      <button className="pg-back" onClick={back}><span aria-hidden="true">↙</span> 返回畫廊</button>
      <div className="pg-game-identity"><span className="pg-eyebrow">THE WIZARD’S GENESIS / COLLECTION {art.number}</span><h1 id="puzzle-title">Puzzle <em>Gallery</em><span className="pg-title-mark" aria-hidden="true">✦</span></h1><p>{art.officialTitle||art.title}<span>／ {model.pieces.length} 片</span></p></div>
      <div className="pg-game-progress"><span>{solved?'已完成':`${placed} / ${model.pieces.length}`}</span><small>{solved?'作品已解鎖':'已定位'}</small><i><b style={{width:`${solved?100:placed/model.pieces.length*100}%`}}/></i></div>
    </motion.header>
    <motion.div className="pg-toolbar" initial={{opacity:0,y:reduced?0:8}} animate={{opacity:1,y:0}} transition={{duration,delay:reduced?0:.08}}>
      <div className="pg-tool-cluster"><label className="pg-difficulty"><span>拼圖片數</span><select value={target} disabled={changing} onChange={e=>requestChange(Number(e.target.value))}>{options.map(t=><option key={t} value={t}>{art.difficultyNames?.[art.difficulties.indexOf(t)]||'舊版進度'} · {createPuzzle(art.width,art.height,t).pieces.length} 片</option>)}</select></label><button className="pg-button pg-button--blue" aria-pressed={preview} onClick={()=>setPreview(!preview)}><span aria-hidden="true">▧</span> 查看原圖</button><button className="pg-link pg-restart" onClick={()=>{table.api.current.finish?.();persist();setConfirm({kind:'reset'})}}>↶ 重新開始</button></div>
      <div className="pg-tool-cluster pg-tool-cluster--table"><button className="pg-link" onClick={()=>table.api.current.next?.()}>翻找散片</button><button className="pg-link" onClick={()=>table.api.current.arrange?.()}>展開散片</button><div className="pg-zoom" role="group" aria-label="工作桌縮放"><button disabled={table.zoomLabel<=45} onClick={()=>table.api.current.zoom?.(-.2)} aria-label="縮小">−</button><button onClick={()=>table.api.current.fit?.()} title="組合區置中">{table.zoomLabel}% <span>置中</span></button><button disabled={table.zoomLabel>=300} onClick={()=>table.api.current.zoom?.(.2)} aria-label="放大">＋</button></div><button className="pg-overview" onClick={()=>table.api.current.fit?.(true)} title="查看全部拼片" aria-label="查看全部拼片">⊡</button></div>
    </motion.div>
    <motion.div className="pg-table-wrap" initial={{opacity:0,y:reduced?0:14}} animate={{opacity:changing?0:1,y:changing&&!reduced?8:0}} transition={{duration:reduced?0:.25}}>
      <div className="pg-desk-edge" aria-hidden="true"><span>01 / PIECE BY PIECE</span><i/><span>PUZZLE TABLE</span></div>
      <div className="pg-table"><canvas ref={table.canvas} tabIndex={0} aria-label="拼圖工作桌。空白鍵翻找拼片，方向鍵移動，Enter 接合及定位，Escape 取消。拖曳空白處平移，雙指縮放。"/>
        {!texture&&<div className="pg-loading" role="status"><span aria-hidden="true">▧</span>{error||'正在準備拼圖…'}</div>}
        <AnimatePresence>{preview&&<motion.aside className="pg-preview" key="reference" initial={{opacity:0,y:reduced?0:10,rotate:reduced?0:2}} animate={{opacity:1,y:0,rotate:0}} exit={{opacity:0,y:reduced?0:8}} transition={{duration:reduced?0:.22}} aria-label="原圖預覽"><header><span>原圖預覽</span><button onClick={()=>setPreview(false)} aria-label="關閉原圖">×</button></header><img src={art.src} alt={`${art.officialTitle||art.title}原圖`}/></motion.aside>}</AnimatePresence>
        {solved&&<motion.div className="pg-solved-note" initial={{opacity:0,y:reduced?0:12}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.6,delay:celebrating&&!reduced?.7:0}}><span>✦</span><p>拼圖完成！</p><button className="pg-link" onClick={openDetails}>欣賞作品 ↗</button></motion.div>}
      </div>
    </motion.div>
    <footer className="pg-game-footer"><p role="status" aria-live="polite">{message}</p><span className={`pg-save ${saved.startsWith('無法')?'has-error':''}`} role="status"><i/>{saved||'進度儲存於此瀏覽器'}</span><details className="pg-help"><summary>操作說明 ⓘ</summary><p>拖曳空白處平移，雙指縮放。空白鍵翻找拼片，方向鍵移動，Shift 精細移動，Enter 接合，Escape 取消。已定位的拼片保持固定。</p></details></footer>
    <AnimatePresence>{confirm&&<PuzzleDialog key="confirm" label={confirm.kind==='reset'?'重新開始確認':'切換難度確認'} onClose={()=>setConfirm(null)}><header className="pg-confirm-header"><span className="pg-eyebrow">PUZZLE GALLERY</span><button className="pg-close" onClick={()=>setConfirm(null)} aria-label="取消">×</button></header><div className="pg-confirm-copy"><span className="pg-confirm-symbol" aria-hidden="true">{confirm.kind==='reset'?'↶':'▦'}</span><h2>{confirm.kind==='reset'?'重新開始這個難度？':'切換拼圖片數？'}</h2><p>{confirm.kind==='reset'?'只會重設目前難度的拼片位置，其他難度進度與作品解鎖紀錄會保留。':`目前的 ${model.pieces.length} 片進度會保留，接著載入 ${createPuzzle(art.width,art.height,confirm.next).pieces.length} 片的${loadProgress(art,confirm.next).hasSaved?'已保存進度':'新拼圖'}。`}</p></div><footer className="pg-confirm-actions"><button className="pg-link" onClick={()=>setConfirm(null)}>取消</button><button className="pg-button pg-button--accent" onClick={applyChange}>{confirm.kind==='reset'?'重新開始':'切換難度'} ↗</button></footer></PuzzleDialog>}{details&&<ArtworkDialog key="artwork" art={art} onClose={()=>{setDetails(false);setCelebrating(false)}} onGallery={back}/>}</AnimatePresence>
  </main>
}
