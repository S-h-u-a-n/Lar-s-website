import { CHARACTER_ASSETS } from './characterAssets'

export default function CharacterDevControls({ characters, values, onChange }) {
  return <details className="ball-character-dev"><summary>角色素材測試</summary>
    {characters.map(character => <fieldset key={character.id}><legend>{character.name}</legend>
      <label>姿勢<select aria-label={`${character.name}測試姿勢`} value={values[character.id]?.body || character.defaultBody} onChange={event => onChange(character.id, { body: event.target.value })}>
        {CHARACTER_ASSETS[character.id].body.poses.map((pose, index) => <option key={pose} value={pose}>{index + 1} / {pose.replace('.PNG', '')}</option>)}
      </select></label>
      <label>表情<select aria-label={`${character.name}測試表情`} value={values[character.id]?.face ?? character.defaultFace} onChange={event => onChange(character.id, { face: Number(event.target.value) })}>
        {Array.from({ length: CHARACTER_ASSETS[character.id].face.count }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
      </select></label>
    </fieldset>)}
    <button type="button" onClick={() => onChange(null)}>恢復預設</button>
  </details>
}
