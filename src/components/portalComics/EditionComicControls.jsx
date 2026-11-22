export default function EditionComicControls({ title, startLabel, onBack, onStart }) {
  return <div className="edition-comic-controls" onClick={event => event.stopPropagation()}>
    <button type="button" onClick={onBack}>↙︎ 回研究室</button>
    {title}
    <button type="button" onClick={onStart}>{startLabel} ↗︎</button>
  </div>
}
