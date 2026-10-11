import leftPortrait from '../../../Art/telescope/t-comic/t-comic3.PNG'
import rightPortrait from '../../../Art/telescope/t-comic/t-comic1.PNG'
// Existing comic panels are decorative fold-outs, not canonical portraits of the placeholder speakers. A future Live2D adapter can still use the original state props.
export default function Live2DSlot({ character, state }) {
  return <div className={`ball-character ball-character-${character.side}`} style={{ ...character.layout, '--character-color': character.color, transform: `scale(${character.layout.scale})` }} data-character={character.id} data-state={state.idle ? 'idle' : 'talking'} data-expression={state.expression || ''} data-motion={state.motion || ''} aria-label={`創世故事插畫 ${character.side==='left'?'01':'02'}`}>
    <img className="edition-character-portrait" src={character.side==='left'?leftPortrait:rightPortrait} alt="原創角色插畫紙偶"/><span>FROM THE STORY / {character.side==='left'?'01':'02'}</span>
  </div>
}
