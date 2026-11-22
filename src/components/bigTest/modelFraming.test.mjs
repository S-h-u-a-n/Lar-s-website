import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createCosmosBillboard } from '../cosmosBillboard.js'
import { getViewportFraming } from './viewportFraming.js'
import { measureHorizontalFraming, applyHorizontalFraming } from './modelFraming.js'

// Load real GLB geometry without browser-only texture decoding. No source asset
// is changed; these tests measure projected geometry, not rendered alpha pixels.
const binary = readFileSync(new URL('../../../Mode/Big.glb', import.meta.url))
const jsonSize = binary.readUInt32LE(12)
const json = JSON.parse(binary.subarray(20, 20 + jsonSize))
json.materials = json.materials.map(() => ({}))
json.images = []; json.textures = []
json.buffers[0].uri = `data:application/octet-stream;base64,${binary.subarray(28 + jsonSize).toString('base64')}`
globalThis.ProgressEvent ??= class {}
const { scene: root } = await new GLTFLoader().parseAsync(JSON.stringify(json), '')
const bounds = new THREE.Box3().setFromObject(root)
const center = bounds.getCenter(new THREE.Vector3())
const radius = bounds.getSize(new THREE.Vector3()).length() / 2
const billboard = createCosmosBillboard(root)
function setup(width, height) {
  const camera = new THREE.PerspectiveCamera(38, width / height, .1, 10000)
  camera.fov = getViewportFraming(width, height).fov
  camera.updateProjectionMatrix()
  camera.position.copy(center).addScaledVector(new THREE.Vector3(1, .68, 1.35).normalize(), radius / Math.tan(38 * Math.PI / 360) * 1.08)
  const controls = new OrbitControls(camera, null)
  controls.target.copy(center)
  controls.enableDamping = true
  controls.update()
  billboard(camera)
  return { camera, controls }
}
for (const [width, height] of [[1440,900], [1920,1080], [2560,1080], [1024,768]]) {
  test(`real GLB framing and stable orbit: ${width}x${height}`, () => {
    for (let entry = 0; entry < 3; entry++) {
      const { camera, controls } = setup(width, height)
      const position = camera.position.clone(), target = controls.target.clone()
      const framing = measureHorizontalFraming(root, camera)
      applyHorizontalFraming(camera, width, height, framing)
      const errorPx = (framing * camera.projectionMatrix.elements[0] - camera.projectionMatrix.elements[8]) * width / 2
      assert.ok(Math.abs(errorPx) < 1e-8)
      let left = Infinity, right = -Infinity
      const vertex = new THREE.Vector3()
      root.updateWorldMatrix(true, true); camera.updateMatrixWorld(true)
      root.traverseVisible(object => {
        if (!object.isMesh) return
        const p = object.geometry.attributes.position
        for (let i = 0; i < p.count; i++) {
          vertex.fromBufferAttribute(p, i).applyMatrix4(object.matrixWorld).project(camera)
          left = Math.min(left, vertex.x); right = Math.max(right, vertex.x)
        }
      })
      assert.ok(Math.abs((left + right) * width / 4) < 1e-6)
      assert.ok(camera.position.equals(position))
      assert.ok(controls.target.equals(target))
      // Compare horizontal + vertical drag and damping to unmodified controls.
      const reference = setup(width, height)
      for (const control of [controls, reference.controls]) {
        control._rotateLeft(.4)
        control._rotateUp(.2)
      }
      for (let frame = 0; frame < 120; frame++) {
        controls.update(); reference.controls.update()
        assert.ok(camera.position.distanceTo(reference.camera.position) < 1e-8)
        assert.ok(controls.target.equals(target))
      }
      camera.aspect = 1920 / 1080
      camera.fov = getViewportFraming(1920,1080).fov
      const rotatedPosition = camera.position.clone()
      for (let i = 0; i < 3; i++) applyHorizontalFraming(camera, 1920, 1080, framing)
      assert.ok(camera.position.equals(rotatedPosition))
      assert.ok(controls.target.equals(target))

    }
  })
}

// Reproduce the DEV-only ordering bug with an explicit saved root translation.
// The draft is synthetic; it is not evidence of the user's browser storage.
for (const [width, height] of [[1440,900], [1920,1080], [2560,1080]]) {
  test(`restore local transforms before framing, not after: ${width}x${height}`, async () => {
    const { prepareModelTransformDraft, apply, getPreparedModelTransformDraft, transformDraftKey } = await import('../../dev/modelTransformDraft.js')
    function view(model) {
      const camera = new THREE.PerspectiveCamera(getViewportFraming(width,height).fov, width/height, .1, 10000)
      const pivot = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3())
      camera.position.copy(pivot).addScaledVector(new THREE.Vector3(1,.68,1.35).normalize(), radius / Math.tan(38*Math.PI/360) * 1.08)
      const controls = new OrbitControls(camera, null)
      controls.target.copy(pivot); controls.update()
      createCosmosBillboard(model)?.(camera)
      applyHorizontalFraming(camera, width, height, measureHorizontalFraming(model, camera))
      return { camera, controls }
    }
    const late = root.clone(true)
    const previous = view(late)
    const right = new THREE.Vector3().setFromMatrixColumn(previous.camera.matrixWorld, 0)
    const draft = { root: { position: late.position.clone().addScaledVector(right, -radius * .4).toArray() } }
    const storage = { getItem: () => JSON.stringify(draft) }
    const lateState = prepareModelTransformDraft(late, 'big-test', 'Big.glb', storage)
    const pixelError = (model, camera) => (measureHorizontalFraming(model,camera) * camera.projectionMatrix.elements[0] - camera.projectionMatrix.elements[8]) * width / 2
    const lateError = pixelError(late, previous.camera)
    assert.ok(lateError < -50, `late restore visibly displaces the model: ${lateError}px`)

    const early = root.clone(true)
    const prepared = prepareModelTransformDraft(early, 'big-test', 'Big.glb', storage)
    const current = view(early)
    assert.ok(Math.abs(pixelError(early, current.camera)) < 1e-6)
    const position = current.camera.position.clone(), pivot = current.controls.target.clone()
    // The editor mounting later reapplies identical absolute transforms and
    // retains the GLB originals for its Reset button; neither moves the view.
    apply(early, prepared.saved.root)
    assert.ok(Math.abs(pixelError(early, current.camera)) < 1e-6)
    assert.ok(position.equals(current.camera.position))
    assert.ok(pivot.equals(current.controls.target))
    assert.deepEqual(getPreparedModelTransformDraft(early, transformDraftKey('big-test','Big.glb')).originals.get('root').position, root.position.toArray())
    assert.deepEqual(lateState.saved, draft)
    console.info(`DEV draft ordering ${width}x${height}: late=${lateError.toFixed(2)}px; prepared=${pixelError(early,current.camera).toFixed(6)}px`)
  })
}
