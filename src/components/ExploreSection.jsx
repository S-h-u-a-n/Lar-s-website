import HomeText, { homeTextIdForSelector } from './main/HomePublishedText'
import { useMemo } from 'react'
import { useEditableText } from '../dev/useEditableText'
import { TOOLS } from '../edition/config'
import './main/HomeExploreGeometry.css'
// Preserve this card's existing editor identity/styles. An empty saved title must
// not erase the destination's name or collapse its heading; other cards are untouched.
function TelescopeCardTitle({ title }) {
  const defaultValues = useMemo(() => ({ text: title }), [title])
  const text = useEditableText({ id: 'codex-home-dom-h3-f6qawo', label: 'Main · 遠方的地球', defaultValues })
  const value = typeof text.text === 'string' && text.text.trim() ? text.text : title
  return <h3 ref={text.ref} {...text.props}>{value}</h3>
}

export default function ExploreSection({onTool}) {
  return <section className="edition-explore" id="explore"><div className="home-explore-geometry" aria-hidden="true"><div className="home-explore-geometry-dots" /><div className="home-explore-geometry-grid" /></div><header><HomeText as="p" className="edition-kicker" configId="codex-home-dom-p-1b5c83w" /><HomeText as="h2" configId="codex-home-dom-h2-1izbhnz" after={<HomeText as="em" configId="codex-home-dom-em-eobkd4" />} /><HomeText as="p" configId="codex-home-dom-p-h4vdc0" /></header><div className="edition-tool-cards">{TOOLS.map(tool=><button data-dev-scope={import.meta.env.DEV ? `tool-${tool.id}` : undefined} key={tool.id} style={{'--tool-color':tool.color}} onClick={()=>onTool(tool.id)}><HomeText as="small" configId={homeTextIdForSelector(`[data-dev-scope="tool-${tool.id}"] > small:nth-of-type(1)`)} /><div className="edition-tool-image"><img src={tool.icon} alt=""/><i>↗</i></div>{tool.id === 'telescope' ? <TelescopeCardTitle title={tool.name} /> : <HomeText as="h3" configId={homeTextIdForSelector(`[data-dev-scope="tool-${tool.id}"] > h3:nth-of-type(1)`)} />}<HomeText as="p" configId={homeTextIdForSelector(`[data-dev-scope="tool-${tool.id}"] > p:nth-of-type(1)`)} /><HomeText configId={homeTextIdForSelector(`[data-dev-scope="tool-${tool.id}"] > span:nth-of-type(1)`)} /></button>)}</div></section>
}
