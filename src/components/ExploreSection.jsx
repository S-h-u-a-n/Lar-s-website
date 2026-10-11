import { TOOLS } from '../edition/config'
export default function ExploreSection({onTool}) {
  return <section className="edition-explore" id="explore"><header><p className="edition-kicker">FIVE WAYS OF LOOKING</p><h2>世界不只一種<br/><em>觀看方式。</em></h2><p>從一件工具開始，<br/>收集你的下一個問題。</p></header><div className="edition-tool-cards">{TOOLS.map(tool=><button key={tool.id} style={{'--tool-color':tool.color}} onClick={()=>onTool(tool.id)}><small>{tool.number} / FIELD INSTRUMENT</small><div className="edition-tool-image"><img src={tool.icon} alt=""/><i>↗</i></div><h3>{tool.name}</h3><p>{tool.question}</p><span>{tool.english}</span></button>)}</div></section>
}
