import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { createPortal } from 'react-dom'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

const viewports = new WeakMap()
export function setModelEditorViewport(model, viewport) { if (import.meta.env.DEV) viewports.set(model, viewport) }
const capture = object => ({ position: object.position.toArray(), rotation: [object.rotation.x, object.rotation.y, object.rotation.z].map(THREE.MathUtils.radToDeg), rotationOrder: object.rotation.order, scale: object.scale.toArray() })
const validVector = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
function apply(object, values) {
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
export default function ModelTransformEditor({ model, pageId, open, onPick, onConfig, panelRef }) {
  const objects = useMemo(() => modelObjects(model?.object), [model?.object])
  const [selectedId, setSelectedId] = useState('root'), [mode, setMode] = useState('translate')
  const [, refresh] = useState(0)
  const originals = useRef(new Map()), saved = useRef({}), controls = useRef(null)
  const draftReadable = useRef(true)
  const callbacks = useRef({ onPick, onConfig, panelRef }); callbacks.current = { onPick, onConfig }
  const key = `genesis:model-editor:${pageId}:${model?.name}:transform-v1`
  const selected = objects.find(entry => entry.id === selectedId) || objects[0]
  function configuration() { return Object.fromEntries(objects.map(entry => [entry.id, { name: entry.object.name, ...(entry.object.name === 'cosmos_plane_01' ? { readOnly: ['rotation'], reason: 'Camera-facing billboard rotation is owned by the render loop' } : {}), ...capture(entry.object) }])) }
  function publish(write = false) {
    const config = configuration()
    callbacks.current.onConfig?.(config)
    if (write) {
      saved.current = { ...saved.current, ...Object.fromEntries(Object.entries(config).map(([id, values]) => [id, { ...saved.current[id], ...values }])) }
      try { if (!draftReadable.current) throw new Error('Unreadable draft is preserved; use Copy Config'); localStorage.setItem(key, JSON.stringify(saved.current)) } catch (error) { console.warn('[3D Editor] Cannot save transform draft', error) }
    }
    refresh(n => n + 1)
    viewports.get(model?.object)?.render?.()
    if (write) window.dispatchEvent(new CustomEvent('model-editor-transform-change', { detail: { object: selected?.object } }))
  }
  useEffect(() => {
    saved.current = {}; draftReadable.current = true
    try {
      const draft = JSON.parse(localStorage.getItem(key) || '{}')
      if (!draft || typeof draft !== 'object' || Array.isArray(draft)) throw new Error('Unknown draft format')
      saved.current = draft
    } catch (error) { draftReadable.current = false; console.warn('[3D Editor] Unreadable transform draft preserved', error) }
    for (const entry of objects) {
      originals.current.set(entry.id, capture(entry.object))
      apply(entry.object, saved.current[entry.id])
      if (saved.current[entry.id]) window.dispatchEvent(new CustomEvent('model-editor-transform-change', { detail: { object: entry.object } }))
    }
    publish()
    return () => { for (const entry of objects) apply(entry.object, originals.current.get(entry.id)) }
  }, [objects, key])
  useEffect(() => {
    const viewport = viewports.get(model?.object)
    if (!open || !viewport || !selected) return
    const { camera, scene, canvas, orbit } = viewport
    const control = new TransformControls(camera, canvas)
    controls.current = control
    control.setMode(selected.object.name === 'cosmos_plane_01' && mode === 'rotate' ? 'translate' : mode); control.setSpace('local'); control.attach(selected.object)
    scene.add(control.getHelper())
    const previousEnabled = orbit?.enabled
    if (orbit) orbit.enabled = false
    const changed = () => publish(true)
    const redraw = () => viewport.render?.()
    control.addEventListener('objectChange', changed); control.addEventListener('change', redraw)
    const pick = event => {
      if (control.axis || event.button !== 0) return
      const rect = canvas.getBoundingClientRect()
      const ray = new THREE.Raycaster()
      ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera)
      const hit = ray.intersectObject(model.object, true)[0]
      if (hit) {
        const entry = objects.find(entry => entry.object === hit.object)
        if (entry) { setSelectedId(entry.id); callbacks.current.onPick?.(entry.object) }
      }
      event.preventDefault(); event.stopImmediatePropagation()
    }
    canvas.addEventListener('pointerdown', pick, true)
    return () => {
      canvas.removeEventListener('pointerdown', pick, true)
      control.removeEventListener('objectChange', changed); control.removeEventListener('change', redraw)
      control.detach(); scene.remove(control.getHelper()); control.dispose(); controls.current = null
      if (orbit) orbit.enabled = previousEnabled
      viewport.render?.()
    }
  }, [open, selected?.object, model?.object, mode, objects])
  useEffect(() => { if (open) refresh(n => n + 1) }, [open])
  const panel = panelRef?.current?.querySelector('.model-editor-transform-host')
  if (!selected || !open || !panel) return null
  const values = capture(selected.object)
  return createPortal(<section className="model-editor-section">
    <strong>Model Transform · {pageId}</strong>
    <label>Object<select aria-label="Transform object" value={selected.id} onChange={event => setSelectedId(event.target.value)}>{objects.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
    <label>Gizmo<select aria-label="Transform mode" value={mode} onChange={event => setMode(event.target.value)}><option value="translate">Move</option><option value="rotate">Rotate</option><option value="scale">Scale</option></select></label>
    {['position','rotation','scale'].map(field => <div key={field} className="model-editor-transform-row"><span>{field}{field === 'rotation' ? ' (deg)' : ''}</span>{['X','Y','Z'].map((axis,index) => <label key={axis}>{axis}<input aria-label={`${field} ${axis}`} type="number" disabled={field === 'rotation' && selected.object.name === 'cosmos_plane_01'} step={field === 'rotation' ? 1 : .01} value={Number(values[field][index].toFixed(5))} onChange={event => {
      if (event.target.value === '') return
      const next = [...values[field]]; next[index] = Number(event.target.value)
      apply(selected.object, { [field]: next }); publish(true)
    }} /></label>)}</div>)}
    <button type="button" onClick={() => { apply(selected.object, originals.current.get(selected.id)); publish(true) }}>Reset Transform</button>
    {selected.object.name === 'cosmos_plane_01' && <small>Billboard rotation follows the camera and cannot be edited independently.</small>}
    <small>Local model coordinates. Pick a mesh on the canvas or drag the gizmo.</small>
  </section>, panel)
}
