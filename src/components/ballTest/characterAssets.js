import manifest from '../../../Art/ball/web/characters.json'

// Eager URL imports create a lookup, not image requests. Only the selected URLs are decoded.
const urls = import.meta.glob([
  '/Art/ball/lar/body/*.PNG', '/Art/ball/tivbo/body/*.PNG',
  '/Art/ball/web/lar/face/*.PNG', '/Art/ball/web/tivbo/face/*.PNG',
  '/Art/ball/decoration/*.PNG',
], { eager: true, query: '?url', import: 'default' })
export const CHARACTER_ASSETS = manifest.characters
export function characterAssetState(id, body = '常規.PNG', face = 1) {
  const spec = CHARACTER_ASSETS[id]
  if (!spec) throw new Error(`Unknown character: ${id}`)
  const pose = typeof body === 'number' ? spec.body.poses[body - 1] : body
  if (!spec.body.poses.includes(pose)) throw new Error(`Unknown ${id} pose: ${body}`)
  if (!Number.isInteger(face) || face < 1 || face > spec.face.count) throw new Error(`Unknown ${id} face: ${face}`)
  return {
    body: pose, face,
    bodyUrl: urls[`/${spec.body.directory}${pose}`],
    faceUrl: urls[`/${spec.face.directory}${face}.PNG`],
  }
}
export function characterDecoration(id) {
  const name = id === 'lar' ? 'lar-green' : 'tivbo-pink'
  return { background: urls[`/Art/ball/decoration/${name}.PNG`], frame: urls[`/Art/ball/decoration/${id}-frame.PNG`] }
}
