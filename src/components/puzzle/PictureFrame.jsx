import {selectedAvatarCover} from './progress'

export default function PictureFrame({art,unlocked}) {
  if(art.kind==='avatars'&&art.items) {
    const cover=selectedAvatarCover(art.items)
    return <span className="pg-frame" data-frame-renderer={art.frame} style={{'--art-ratio':`${art.width}/${art.height}`}}><span className="pg-frame-corners" aria-hidden="true"><i/><i/><i/><i/></span><span className="pg-frame-mat"><span className="pg-frame-opening">{cover?<img className="pg-avatar-cover" src={cover.src} alt={`角色頭像展示封面：${cover.title}`} draggable="false"/>:<span className="pg-avatar-default" role="img" aria-label="尚未設定角色頭像展示封面"><span aria-hidden="true">✦</span><strong>選擇展示封面</strong><small>完成角色拼圖後即可設定</small></span>}</span></span></span>
  }
  return <span className="pg-frame" data-frame-renderer={art.frame} style={{'--art-ratio':`${art.width}/${art.height}`}}><span className="pg-frame-corners" aria-hidden="true"><i/><i/><i/><i/></span><span className="pg-frame-mat"><span className="pg-frame-opening">{unlocked?<img src={art.src} alt={art.title} draggable="false"/>:<span className="pg-unknown" aria-label="尚未完成的作品">?</span>}</span></span></span>
}
