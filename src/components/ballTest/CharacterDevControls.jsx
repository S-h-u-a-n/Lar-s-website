import { CHARACTER_ASSETS } from './characterAssets'
import { PORTRAIT_TRANSITIONS } from './portraitTransitions'

export default function CharacterDevControls({ characters, values, onChange }) {
  return <details className="ball-character-dev"><summary>角色素材測試</summary>
    {characters.map(character => <fieldset key={character.id}><legend>{character.name}</legend>
      <label>姿勢<select aria-label={`${character.name}測試姿勢`} value={typeof values[character.id]?.body === 'number' ? CHARACTER_ASSETS[character.id].body.poses[values[character.id].body - 1] : values[character.id]?.body || character.defaultBody} onChange={event => onChange(character.id, { body: event.target.value })}>
        {CHARACTER_ASSETS[character.id].body.poses.map((pose, index) => <option key={pose} value={pose}>{index + 1} / {pose.replace('.PNG', '')}</option>)}
      </select></label>
      <label>表情<select aria-label={`${character.name}測試表情`} value={values[character.id]?.face ?? character.defaultFace} onChange={event => onChange(character.id, { face: Number(event.target.value) })}>
        {Array.from({ length: CHARACTER_ASSETS[character.id].face.count }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
      </select></label>
      <label>轉場<select aria-label={`${character.name}測試轉場`} value={values[character.id]?.transition ?? 0} onChange={event => onChange(character.id, { transition: Number(event.target.value) })}>
        {PORTRAIT_TRANSITIONS.map(mode => <option key={mode.id} value={mode.id}>{mode.id} / {mode.name}</option>)}
      </select></label>
      <button type="button" onClick={() => onChange(character.id, { revision: (values[character.id]?.revision ?? 0) + 1 })}>重播轉場</button>
    </fieldset>)}
    <button type="button" onClick={() => onChange(null)}>恢復預設</button>
  </details>
}
