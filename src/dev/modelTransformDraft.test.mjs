import test from 'node:test'
import assert from 'node:assert/strict'
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from 'three'
import { prepareModelTransformDraft, getPreparedModelTransformDraft, transformDraftKey, modelObjects, apply } from './modelTransformDraft.js'

function model() {
  const root = new Group()
  const child = new Mesh(new BoxGeometry(), new MeshBasicMaterial())
  child.name = 'table'
  root.add(child)
  return root
}

test('draft restoration is synchronous, preserves originals and never writes storage', () => {
  const root = model()
  let reads = 0
  const saved = { root: { position: [-35, 0, 0] }, 'root/0:table': { scale: [2, 1, 1] } }
  const storage = { getItem(key) { reads++; assert.equal(key, transformDraftKey('big-test','Big.glb')); return JSON.stringify(saved) }, setItem() { assert.fail('restoring must not rewrite the draft') } }
  const state = prepareModelTransformDraft(root, 'big-test', 'Big.glb', storage)
  assert.deepEqual(root.position.toArray(), [-35,0,0])
  assert.deepEqual(root.children[0].scale.toArray(), [2,1,1])
  assert.deepEqual(state.originals.get('root').position, [0,0,0])
  assert.equal(getPreparedModelTransformDraft(root, state.key), state)
  assert.equal(prepareModelTransformDraft(root, 'big-test', 'Big.glb', storage), state)
  assert.equal(reads, 1)
  // Mirrors editor effect cleanup/setup (including React StrictMode).
  for (const entry of modelObjects(root)) apply(entry.object, state.originals.get(entry.id))
  for (const entry of modelObjects(root)) apply(entry.object, state.saved[entry.id])
  assert.deepEqual(root.position.toArray(), [-35,0,0])
})

test('empty and invalid transform vectors leave original transforms intact', () => {
  const root = model()
  prepareModelTransformDraft(root, 'big-test', 'Big.glb', { getItem: () => JSON.stringify({ root: { position: [4,5], scale: [0,1,1] } }) })
  assert.deepEqual(root.position.toArray(), [0,0,0])
  assert.deepEqual(root.scale.toArray(), [1,1,1])
  const fresh = model()
  prepareModelTransformDraft(fresh, 'big-test', 'Big.glb', { getItem: () => null })
  assert.deepEqual(fresh.position.toArray(), [0,0,0])
})

test('draft restoration leaves billboard rotation under scene control', () => {
  const root = model()
  root.children[0].name = 'cosmos_plane_01'
  root.children[0].rotation.y = .25
  prepareModelTransformDraft(root, 'big-test', 'Big.glb', { getItem: () => JSON.stringify({ 'root/0:cosmos_plane_01': { rotation: [90,90,90], position: [2,3,4] } }) })
  assert.equal(root.children[0].rotation.y, .25)
  assert.deepEqual(root.children[0].position.toArray(), [2,3,4])
})
