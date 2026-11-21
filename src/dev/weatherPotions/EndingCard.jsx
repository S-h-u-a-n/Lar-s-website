import { EndingMark } from './LineArt'

export default function EndingCard({ ending, onRewind, replayRef }) {
  return <section className="wp-ending-layer" role="region" aria-labelledby="wp-ending-title" aria-describedby="wp-ending-description">
    <div className="wp-ending-paper" style={{ '--ending-color': ending.color }}>
      <div className="wp-ending-heading"><span className="edition-kicker">A SMALL ACCIDENT / {ending.number}</span><EndingMark type={ending.symbol} /></div>
      <h2 id="wp-ending-title">{ending.title}</h2>
      <p id="wp-ending-description">{ending.text}</p>
      <button className="edition-enter wp-replay" ref={replayRef} onClick={onRewind}><span>啟用回溯魔法</span><i>↶</i></button>
      <small>世界回到原點。魔法師假裝沒事。</small>
    </div>
  </section>
}
