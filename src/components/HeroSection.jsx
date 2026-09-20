import mainVisual from "../../畫/主視覺/主視覺（加深）.png";

function HeroSection() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-art" aria-label="The Wizard's Genesis main artwork">
        <img src={mainVisual} alt="The Wizard's Genesis 主視覺插畫" />
      </div>
      <div className="hero-copy" id="genesis">
        <p className="eyebrow">Wizards created the earth.<br />And we explore its story.</p>
        <h1 id="hero-title">
          <span className="title-pre">The Wizard&apos;s</span>
          <span className="title-main">GENESIS</span>
          <span className="title-subtitle">魔法師們的創世紀</span>
        </h1>
        <p className="hero-intro">
          魔法師們創造出地球，<br />而我們將重新認識這個世界。
        </p>
        <a className="enter-link" href="#explore">
          <span className="enter-symbol" aria-hidden="true">✦</span>
          <span>Enter the world</span>
          <span className="enter-arrow" aria-hidden="true">→</span>
        </a>
      </div>
      <div className="hero-note" aria-hidden="true">
        <span>Scroll</span>
        <span className="hero-note-line" />
      </div>
    </section>
  )
}

export default HeroSection