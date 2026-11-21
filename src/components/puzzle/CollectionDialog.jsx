import {useState} from 'react'
import PuzzleDialog from './PuzzleDialog'
import {selectedAvatarCover,setAvatarCover,unlocked} from './progress'
import ArtworkCopy from './ArtworkCopy'
import LongImageViewer from './LongImageViewer'
import {artworkLayout} from './artworkLayout'

export default function CollectionDialog({art,onClose,onPlay}) {
  const [view,setView]=useState(false)
  const [coverId,setCoverId]=useState(()=>art.kind==='avatars'?selectedAvatarCover(art.items)?.id:null)
  const [profileId,setProfileId]=useState(null)
  const count=art.items.filter(unlocked).length,complete=count===art.items.length
  const selectedProfile=art.kind==='avatars'?art.items.find(item=>item.id===profileId&&unlocked(item)):null
  function chooseCover(item){if(setAvatarCover(art.items,item))setCoverId(item.id)}
  const layout=art.kind==='triptych'?'panoramic':art.kind==='avatars'?'collection':artworkLayout(art.width,art.height)
  return <PuzzleDialog label={art.title} wide layout={layout} onClose={onClose}>
    <header className="pg-art-header"><span className="pg-eyebrow">PUZZLE GALLERY / {art.number}</span><button className="pg-close" onClick={onClose}>返回畫廊 ×</button></header>
    <div className="pg-art-scroll">
      <div className={`pg-collection-heading${art.kind==='triptych'?' pg-collection-heading--triptych':''}`}>
        <div><h2>{art.title}</h2><p role="status">已完成 {count} / {art.items.length} · 每份拼圖皆可選擇三種難度，進度分別保存。</p>
          {art.kind==='triptych'&&<p>{complete?'完整作品已解鎖，可隨時欣賞或重新挑戰各部分。':'分別完成三部分的任一難度，即可解鎖完整長圖。'}</p>}
        </div>
        {art.kind==='triptych'&&<button className="pg-button pg-button--accent" disabled={!complete} onClick={()=>setView(true)}>{complete?'欣賞完整長圖 ↗':'完整長圖尚未解鎖'}</button>}
      </div>
      {art.kind==='avatars'&&selectedProfile&&<section className={`pg-avatar-profile pg-avatar-profile--${artworkLayout(selectedProfile.width,selectedProfile.height)}`} aria-label={`${selectedProfile.title}角色介紹`}>
        <img src={selectedProfile.src} alt={selectedProfile.title}/>
        <ArtworkCopy art={{...selectedProfile,...selectedProfile.profile}} title={selectedProfile.title}/>
        <button className="pg-button pg-button--peach" onClick={()=>onPlay(selectedProfile.id)}>開始拼圖 ↗</button>
      </section>}
      <div className={`pg-collection-grid ${art.kind==='avatars'?'pg-collection-grid--avatars':''} ${art.kind==='triptych'?'pg-collection-grid--triptych':''}`}>
        {art.items.map(item=>{const done=unlocked(item);return <article className="pg-collection-item" key={item.id}>
          {done?(art.kind==='avatars'?<button className={`pg-avatar-select${profileId===item.id?' is-selected':''}`} onClick={()=>setProfileId(item.id)} aria-label={`查看${item.title}的角色介紹`} aria-pressed={profileId===item.id}><img src={item.src} alt={item.title} loading="lazy"/></button>:<img src={item.src} alt={item.title} loading="eager" style={{'--art-ratio':`${item.width} / ${item.height}`}}/>):<span className="pg-collection-item-placeholder" role="img" aria-label="尚未完成的角色頭像">?</span>}
          <div className="pg-chapter-heading"><h3>{item.title}</h3>{item.subtitle&&<small>{item.subtitle}</small>}</div><span className="pg-collection-tag"><i/>{done?'已完成 · 已收藏':'尚未完成'}</span>
          {art.kind==='triptych'&&item.description&&<section className="pg-chapter-story">{item.description.split(/\n\s*\n/).map((p,i)=><p key={i}>{p}</p>)}</section>}
          {art.kind==='avatars'&&<button className={`pg-button pg-cover-button${coverId===item.id?' is-selected':''}`} disabled={!done} onClick={()=>chooseCover(item)} aria-pressed={coverId===item.id}>{coverId===item.id?'目前展示封面':'設為展示封面'}</button>}
          <button className="pg-button pg-button--peach" onClick={()=>onPlay(item.id)}>{art.kind==='avatars'?'開始拼圖':done?'再次拼圖':'進入拼圖'} ↗</button>
        </article>})}
      </div>
      {art.kind==='triptych'&&<ArtworkCopy art={art} className="pg-triptych-copy"/>}
      {view&&complete&&art.kind==='triptych'&&<LongImageViewer src={art.src} onClose={()=>setView(false)}/>}
    </div>
  </PuzzleDialog>
}
