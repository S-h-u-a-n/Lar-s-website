import * as THREE from 'three'

export const capture = object => ({ position: object.position.toArray(), rotation: [object.rotation.x, object.rotation.y, object.rotation.z].map(THREE.MathUtils.radToDeg), rotationOrder: object.rotation.order, scale: object.scale.toArray() })
const validVector = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
export function apply(object, values) {
  if (validVector(values?.position)) object.position.fromArray(values.position)
  if (object.name !== 'cosmos_plane_01' && validVector(values?.rotation)) object.rotation.set(...values.rotation.map(THREE.MathUtils.degToRad), values.rotationOrder || object.rotation.order)
  if (validVector(values?.scale) && values.scale.every(n => Math.abs(n) > .000001)) object.scale.fromArray(values.scale)
  object.updateMatrixWorld(true)
}
export function modelObjects(root) {
  const entries = []
  const walk = (object, path) => { if (path !== 'root' && object.userData.update) return; entries.push({ object, id: path, label: `${path} · ${object.name || object.type}` }); object.children.forEach((child, index) => walk(child, `${path}/${index}:${child.name || child.type}`)) }
  if (root) walk(root, 'root')
  return entries
}

const prepared = new WeakMap()
export const transformDraftKey = (pageId, modelName) => `genesis:model-editor:${pageId}:${modelName}:transform-v1`

// Big calls this before measuring its camera. Preserve the unedited originals
// so mounting the editor later does not turn saved coordinates into Reset values.
export function prepareModelTransformDraft(root, pageId, modelName, storage) {
  const key = transformDraftKey(pageId, modelName)
  const cached = prepared.get(root)
  if (cached?.key === key) return cached
  const objects = modelObjects(root)
  const originals = new Map(objects.map(entry => [entry.id, capture(entry.object)]))
  let saved = {}, readable = true
  try {
    saved = JSON.parse((storage ?? globalThis.localStorage)?.getItem(key) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Unknown draft format')
  } catch (error) {
    saved = {}; readable = false
    console.warn('[3D Editor] Unreadable transform draft preserved', error)
  }
  for (const entry of objects) apply(entry.object, saved[entry.id])
  root.updateWorldMatrix(true, true)
  const result = { key, originals, saved, readable }
  prepared.set(root, result)
  return result
}

export function getPreparedModelTransformDraft(root, key) {
  const value = prepared.get(root)
  return value?.key === key ? value : null
}
