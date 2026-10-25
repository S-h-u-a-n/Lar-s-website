import HomeText, { HomePublishedTextPersistence } from './main/HomePublishedText'
import mainVisual from '../../Art/Edition/main-original.jpg'
import MainArtworkReveal from './main/MainArtworkReveal'
import './Prelude.css'
export default function HeroSection({onEnter,isHomeVisible,revealed,onRevealComplete,onTool}) {
  return <section className={`hero edition-hero ${revealed?'is-revealed':''}`} id="top" aria-labelledby="hero-title">
    <HomePublishedTextPersistence /><div className="edition-cover-copy"><HomeText as="p" configId="codex-home-dom-p-xe2mtg" className="edition-kicker" /><HomeText as="h1" id="hero-title" configId="codex-home-dom-h1-1cr15uf" before={<HomeText as="span" configId="codex-home-dom-span-173manu"  />} after={<HomeText as="em" configId="codex-home-dom-em-1n6ksoi"  />} /><HomeText as="p" configId="codex-home-dom-p-8329nk" className="edition-cover-description" /><button className="edition-enter" onClick={onEnter}><HomeText as="span" configId="codex-home-dom-span-jp8wqh"  /><i>↗</i></button><HomeText as="small" configId="codex-home-dom-small-18v9iuc"  /></div>
    <figure className="edition-cover-art"><div id="main-artwork" data-layout-id="main-artwork" style={{transform:'none'}}><img className="layout-editor-item-image" src={mainVisual} alt="魔法師在研究室裡共同觀測地球"/>{!revealed&&<MainArtworkReveal enabled={isHomeVisible} onComplete={onRevealComplete}/>}</div><figcaption><HomeText as="span" configId="codex-home-dom-span-12darz5"  /><HomeText as="span" configId="codex-home-dom-span-dvj1si"  /></figcaption><i className="edition-cover-stamp">OPEN<br/>TO<br/>WONDER</i></figure>
    <div className="edition-cover-bottom"><HomeText as="span" configId="codex-home-dom-span-41egtv"  /><HomeText as="span" configId="codex-home-dom-span-1fijogg"  /><HomeText as="button" configId="codex-home-dom-button-jzzx93" onClick={()=>onTool('telescope')}  /></div>
  </section>
}
