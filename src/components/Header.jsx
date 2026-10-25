import HomeText from './main/HomePublishedText'
function Header({onHome,onExplore,onStory,onIndex}) {
  return <header className="site-header edition-header"><button className="edition-wordmark" onClick={onHome}><HomeText configId="codex-home-dom-span-1ispmjd" /><HomeText configId="codex-home-dom-span-10r4hy5" after={<b>GENESIS</b>} /></button><HomeText as="p" configId="codex-home-dom-p-2s1if7" /><nav aria-label="Main navigation"><HomeText as="button" configId="codex-home-dom-button-nkof4m" onClick={onHome} /><HomeText as="button" configId="codex-home-dom-button-1q7hept" onClick={onStory} /><HomeText as="button" configId="codex-home-dom-button-ku24z3" onClick={onExplore} /><HomeText as="button" configId="codex-home-dom-button-p81wet" onClick={onIndex} /></nav></header>
}
export default Header
