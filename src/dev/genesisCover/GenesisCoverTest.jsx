import { useRef, useState } from 'react'
import placements from '../history/placements.json'
import './genesis-cover.css'

const art = name => new URL(`../../../Art/IntroScreen/history/${name}.PNG`, import.meta.url).href
const panorama = placements.filter(item => !item.id.startsWith('layer'))

export default function GenesisCoverTest() {
  const [edition, setEdition] = useState(0)
  const [opened, setOpened] = useState(false)
  const entryButton = useRef(null)
  return <main className="gc-test">
    <div className="gc-sheet" key={edition}>
      <header className="gc-masthead" inert={opened}><span>THE WIZARD’S COLLECTION</span><span>創世圖冊 <i>／</i> VOL. 01</span><button onClick={() => { setOpened(false); setEdition(n => n + 1) }}>重印封面 ↻</button></header>
      <div className="gc-cover" inert={opened}>
        <div className="gc-copy gc-print">
          <p className="gc-eyebrow"><span>序 章</span> A WORLD WAITING TO BE DISCOVERED</p>
          <h1><span>The Wizard’s</span>GENESIS<span className="gc-title-zh">創 世 圖 冊</span></h1>
          <div className="gc-rule"><span>✦</span></div>
          <p className="gc-description">從一個好奇的念頭，走進世界的起點。<br/>翻閱時間的痕跡，探索自然、人類與想像的交界。</p>
          <button ref={entryButton} className="gc-enter" aria-expanded={opened} aria-controls={opened ? 'gc-leaf' : undefined} onClick={() => setOpened(true)}><span className="gc-enter-icon">↗︎</span><span>進入世界<small>OPEN THE ATLAS</small></span><span className="gc-enter-line" /></button>
          <p className="gc-caption">每一次探索，都是新的一頁。</p>
        </div>
        <div className="gc-observation gc-print" aria-hidden="true">
          <div className="gc-orbit gc-orbit-outer"/><div className="gc-orbit gc-orbit-inner"/>
          <span className="gc-north">N<br/>⌖</span><span className="gc-star gc-star-one">✧</span><span className="gc-star gc-star-two">✦</span>
          <img className="gc-globe" src={art('map-1')} alt=""/>
          <div className="gc-character"><img src={art('layer-3')} alt="" /></div>
          <div className="gc-specimen"><span>FIG. 001</span><em>世界，尚待發現。</em><span>AN ATLAS OF WONDERS</span></div>
          <span className="gc-orbit-note">OBSERVE · WONDER · EXPLORE</span>
        </div>
      </div>
      <section className="gc-history gc-print" aria-label="人類發展史插畫長卷">
        <div className="gc-history-label"><span>THE THREAD OF TIME</span><span>沿著時間，尋找我們的故事 <i>→</i></span></div>
        <div className="gc-panorama" aria-hidden="true">{panorama.map(item => <img key={item.id} src={art(item.id)} alt="" loading="lazy" style={{left:`${item.x / 12524 * 100}%`,top:`${(item.y - 1100) / 1520 * 100}%`,width:`${item.width / 12524 * 100}%`,zIndex:item.id.startsWith('people') ? 2 : 1}} />)}</div>
      </section>
      <footer className="gc-colophon"><span>NATURE <b>✧</b> HUMANITY <b>✧</b> IMAGINATION</span><span>一個關於世界的奇想收藏</span><span>封面習作 <i>／</i> 001</span></footer>
      {opened && <section id="gc-leaf" className="gc-leaf" role="dialog" aria-modal="true" aria-labelledby="gc-leaf-title" onKeyDown={event => { if (event.key === 'Escape') { setOpened(false); entryButton.current?.focus() } }}><span className="gc-eyebrow">THE FIRST LEAF ／ 001</span><h2 id="gc-leaf-title">世界，從好奇開始。</h2><p>這是封面實驗的翻頁預覽。<br/>故事與探索，將從這裡展開。</p><button autoFocus onClick={() => { setOpened(false); requestAnimationFrame(() => entryButton.current?.focus()) }}>← 闔上圖冊</button></section>}
    </div>
  </main>
}
