function Header({onHome,onExplore,onStory,onIndex}) {
  return <header className="site-header edition-header"><button className="edition-wordmark" onClick={onHome}><span>✧</span><span>The Wizard's<br/><b>GENESIS</b></span></button><p>CODEX EDITION <i>／</i> 研究手冊</p><nav aria-label="Main navigation"><button onClick={onHome}>世界封面</button><button onClick={onStory}>創世故事</button><button onClick={onExplore}>進入研究室 ↗</button><button onClick={onIndex}>探索工具 ＋</button></nav></header>
}
export default Header
