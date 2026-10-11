import mainVisual from '../../Art/Edition/main-original.jpg'
import MainArtworkReveal from './main/MainArtworkReveal'
import './Prelude.css'
export default function HeroSection({onEnter,isHomeVisible,revealed,onRevealComplete,onTool}) {
  return <section className={`hero edition-hero ${revealed?'is-revealed':''}`} id="top" aria-labelledby="hero-title">
    <div className="edition-cover-copy"><p className="edition-kicker">A FIELD GUIDE TO A WORLD WITHOUT MAGIC</p><h1 id="hero-title"><span>The Wizard's</span>GENESIS<em>魔法師們的創世紀</em></h1><p className="edition-cover-description">魔法師們創造出地球，<br/>而我們將重新認識這個世界。</p><button className="edition-enter" onClick={onEnter}><span>走進創世研究室</span><i>↗</i></button><small>以好奇心為指南，以世界為研究對象。</small></div>
    <figure className="edition-cover-art"><div id="main-artwork" data-layout-id="main-artwork" style={{transform:'none'}}><img className="layout-editor-item-image" src={mainVisual} alt="魔法師在研究室裡共同觀測地球"/>{!revealed&&<MainArtworkReveal enabled={isHomeVisible} onComplete={onRevealComplete}/>}</div><figcaption><span>PLATE 01 / THE CREATION ROOM</span><span>一個由魔法創造，卻沒有魔法的世界。</span></figcaption><i className="edition-cover-stamp">OPEN<br/>TO<br/>WONDER</i></figure>
    <div className="edition-cover-bottom"><span>01 / THE BEGINNING</span><span>向下翻閱，選擇你的觀測工具 ↓</span><button onClick={()=>onTool('telescope')}>先看看遠方 ↗</button></div>
  </section>
}
