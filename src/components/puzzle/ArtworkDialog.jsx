import {useState} from 'react'
import PuzzleDialog from './PuzzleDialog'
import ArtworkCopy from './ArtworkCopy'
import {artworkLayout} from './artworkLayout'
export default function ArtworkDialog({art,onClose,onPlay,onGallery}) {
  const [large,setLarge]=useState(false)
  const work=art.collectionInfo||art
  return <PuzzleDialog label="作品介紹" wide layout={artworkLayout(art.width,art.height)} onClose={onClose}>
    <header className="pg-art-header"><span className="pg-eyebrow">PUZZLE GALLERY / {art.number}</span><button className="pg-close" onClick={onClose} aria-label="關閉作品介紹">收起作品 <span>×</span></button></header>
    <div className={`pg-art-scroll ${large?'is-enlarged':''}`}>
      <figure className="pg-collected-art"><img src={art.src} alt={`${work.officialTitle||work.title}${art.collectionInfo?`｜${art.title}`:''}`}/><figcaption><span>{art.number} / 已收藏</span><button className="pg-link" aria-pressed={large} onClick={()=>setLarge(!large)}>{large?'圖文檢視':'只看作品'} <span aria-hidden="true">↗︎</span></button></figcaption></figure>
      {!large&&<ArtworkCopy art={art.collectionInfo?{...work,description:art.description}:work} title={art.collectionInfo?`${work.officialTitle}｜${art.title}`:undefined} subtitle={art.subtitle}/>}
    </div>
    <footer className="pg-art-footer"><span className="pg-collection-tag"><i/>作品已解鎖</span><div>{onPlay&&<button className="pg-button pg-button--accent" onClick={onPlay}>再次拼圖 ↗︎</button>}{onGallery&&<button className="pg-button pg-button--accent" onClick={onGallery}>返回畫廊 ↗︎</button>}<button className="pg-link" onClick={onClose}>繼續欣賞</button></div></footer>
  </PuzzleDialog>
}
