import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import ResourceStatus from '../edition/ResourceStatus'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createCosmosBillboard } from './cosmosBillboard'
import ModelMaterialEditor from '../dev/ModelMaterialEditor'
import { setModelEditorViewport } from '../dev/ModelTransformEditor'
import { attachFinalColorControls } from '../dev/modelMaterialEditorShader'
import { applyModelMaterialPreset, MODEL_MATERIAL_PRESETS } from './modelMaterialPresets'

const GLOBE_MODEL_URL = new URL('../../Mode/globe.glb', import.meta.url).href
const GLOBE_VIEW_OFFSET_X = 0.24
const SELECTABLE_CELESTIAL_NAMES = new Set([
  'sun', 'earth', 'moon', 'jupiter', 'mars', 'mercury',
  'neptune', 'pluto', 'saturn', 'uranus', 'venus',
])
const CELESTIAL_FOCUS_DURATION = 1000

function disposeObject(root) {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  root.traverse(object => {
    if (!object.isMesh) return
    geometries.add(object.geometry)
    for (const material of [].concat(object.material)) {
      materials.add(material)
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value)
      }
    }
  })
  geometries.forEach(geometry => geometry.dispose())
  textures.forEach(texture => texture.dispose())
  materials.forEach(material => material.dispose())
}

function GlobeViewer({ onSelectionChange, onReady, interactionDisabled = false, transparent = false }) {
  const callbacks = useRef({ onSelectionChange, onReady })
  callbacks.current = { onSelectionChange, onReady }
  const controlsRef = useRef(null)
  const disabledRef = useRef(interactionDisabled)
  disabledRef.current = interactionDisabled
  useEffect(() => { if (controlsRef.current) controlsRef.current.enabled = !interactionDisabled }, [interactionDisabled])
  const [resourceStatus,setResourceStatus]=useState('loading'),[retry,setRetry]=useState(0)
  const hostRef = useRef(null)
  const [editorModel, setEditorModel] = useState(null)

  useEffect(() => {
    setResourceStatus('loading')
    const host = hostRef.current
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%'
    host.appendChild(canvas)
    const scene = new THREE.Scene()
    scene.background = transparent ? null : new THREE.Color(0xfdf9ee)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0xfdf9ee, transparent ? 0 : 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d2cc, 2.1))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
    keyLight.position.set(4, 7, 5)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6)
    scene.add(fillLight, fillLight.target)
    const fillRight = new THREE.Vector3()
    const fillUp = new THREE.Vector3()
    const controls = new OrbitControls(camera, canvas)
    controlsRef.current = controls
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minPolarAngle = 0.16
    controls.maxPolarAngle = Math.PI - 0.16
    let root
    let finalColorAttachments = []
    let updateCosmosBillboard
    let frame = 0
    let disposed = false
    let focusAnimation = null
    let transitionHandoff = null
    let focusedCelestial = null
    let initialView = null
    const originalDamping = controls.enableDamping
    let pointerDown = null
    let hoveredCelestial = null
    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      if (!width || !height) return
      camera.aspect = width / height
      camera.setViewOffset(width, height, width * GLOBE_VIEW_OFFSET_X, 0, width, height)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    const render = () => {
      if (disposed) return
      if (focusAnimation) {
        const elapsed = performance.now() - focusAnimation.startedAt
        const progress = Math.min(elapsed / CELESTIAL_FOCUS_DURATION, 1)
        const eased = 1 - ((1 - progress) ** 3)
        camera.position.lerpVectors(focusAnimation.startPosition, focusAnimation.endPosition, eased)
        controls.target.lerpVectors(focusAnimation.startTarget, focusAnimation.endTarget, eased)
        camera.lookAt(controls.target)
        if (progress >= 1) {
          camera.position.copy(focusAnimation.endPosition)
          controls.target.copy(focusAnimation.endTarget)
          camera.lookAt(controls.target)
          transitionHandoff = { dampingWasEnabled: controls.enableDamping }
          focusAnimation = null
        }
      }
      if (transitionHandoff) {
        controls.enableDamping = false
        controls.update()
        controls.enableDamping = transitionHandoff.dampingWasEnabled
        controls.enabled = !disabledRef.current
        transitionHandoff = null
      } else if (!focusAnimation) {
        controls.update()
      }
      camera.updateMatrixWorld()
      fillRight.setFromMatrixColumn(camera.matrixWorld, 0)
      fillUp.setFromMatrixColumn(camera.matrixWorld, 1)
      fillLight.target.position.copy(controls.target)
      fillLight.position.copy(camera.position).addScaledVector(fillRight, -0.3 * camera.position.distanceTo(controls.target)).addScaledVector(fillUp, 0.3 * camera.position.distanceTo(controls.target))
      updateCosmosBillboard?.(camera)
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }

    const updatePointer = event => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const findCelestial = object => {
      let current = object
      while (current) {
        if (SELECTABLE_CELESTIAL_NAMES.has(current.name)) return current
        current = current.parent
      }
      return null
    }
    const pickCelestial = event => {
      if (!root) return null
      updatePointer(event)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(root, true).find(intersection => findCelestial(intersection.object))
      return hit ? findCelestial(hit.object) : null
    }
    const animateCameraTo = (targetPosition, targetControlsTarget, viewSettings) => {
      if (transitionHandoff) {
        controls.enableDamping = originalDamping
        controls.enabled = !disabledRef.current
        transitionHandoff = null
      }
      // Replacing the single animation state cancels any transition still in progress.
      focusAnimation = {
        startedAt: performance.now(),
        startPosition: camera.position.clone(),
        endPosition: targetPosition.clone(),
        startTarget: controls.target.clone(),
        endTarget: targetControlsTarget.clone(),
      }
      controls.enabled = false
      controls.minDistance = viewSettings.minDistance
      controls.maxDistance = viewSettings.maxDistance
      camera.near = viewSettings.near
      camera.far = viewSettings.far
      camera.updateProjectionMatrix()
    }
    const focusObject = object => {
      const bounds = new THREE.Box3().setFromObject(object)
      const sphere = bounds.getBoundingSphere(new THREE.Sphere())
      const focusRadius = Math.max(sphere.radius, 0.001)
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      const framingAspect = Math.min(camera.aspect, 0.78)
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * framingAspect)
      const fitDistance = Math.max(
        focusRadius / Math.tan(verticalFov / 2),
        focusRadius / Math.tan(horizontalFov / 2),
      )
      const distance = fitDistance * 0.72
      const viewDirection = camera.position.clone().sub(controls.target).normalize()
      if (!Number.isFinite(viewDirection.lengthSq()) || viewDirection.lengthSq() === 0) viewDirection.set(1, 0, 0)
      const nextPosition = sphere.center.clone().addScaledVector(viewDirection, distance)
      focusedCelestial = object
      callbacks.current.onSelectionChange?.(object.name)
      animateCameraTo(nextPosition, sphere.center, {
        minDistance: Math.max(focusRadius * 0.55, 0.1),
        maxDistance: Math.max(focusRadius * 5, distance * 3),
        near: Math.max(0.01, focusRadius / 100),
        far: Math.max(1000, distance + focusRadius * 4),
      })
    }
    const resetView = () => {
      if (!initialView) return
      focusedCelestial = null
      callbacks.current.onSelectionChange?.(null)
      animateCameraTo(initialView.cameraPosition, initialView.target, initialView)
    }
    const handlePointerMove = event => {
      const selected = pickCelestial(event)
      if (selected !== hoveredCelestial) {
        hoveredCelestial = selected
        canvas.style.cursor = selected ? 'pointer' : ''
      }
    }
    const handlePointerDown = event => {
      if (disabledRef.current) return
      pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() }
    }
    const handlePointerUp = event => {
      if (disabledRef.current || !pointerDown) { pointerDown = null; return }
      const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y)
      const duration = performance.now() - pointerDown.time
      pointerDown = null
      if (distance <= 6 && duration <= 500) {
        const selected = pickCelestial(event)
        if (selected) focusObject(selected)
        else if (focusedCelestial) resetView()
      }
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)
    new GLTFLoader().load(GLOBE_MODEL_URL, gltf => {
      if (disposed) {
        disposeObject(gltf.scene)
        return
      }
      root = gltf.scene
      const globePreset = MODEL_MATERIAL_PRESETS['globe.glb']
      applyModelMaterialPreset(root, globePreset)
      const attachedMaterials = new Set()
      root.traverse(object => {
        if (!object.isMesh) return
        for (const material of [].concat(object.material)) {
          if (!material) continue
          if (material.map) {
            if (attachedMaterials.has(material)) continue
            attachedMaterials.add(material)
            const shaderDefaults = globePreset.shaderDefaults[`${object.name} / ${material.name}`]
            const attachment = attachFinalColorControls(material, shaderDefaults, { includeBuiltIn: true })
            if (attachment) finalColorAttachments.push(attachment)
          }
        }
      })
      if (import.meta.env.DEV) { setModelEditorViewport(root, { camera, scene, canvas, orbit: controls, render: () => renderer.render(scene, camera) }); setEditorModel(root) }
      const bounds = new THREE.Box3().setFromObject(root)
      const center = bounds.getCenter(new THREE.Vector3())
      const sphere = bounds.getBoundingSphere(new THREE.Sphere())
      const radius = sphere.radius
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      // Preserve the established globe framing after expanding the canvas from
      // the old 48% column to the full page; this does not constrain rendering.
      const framingAspect = Math.min(camera.aspect, 0.78)
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * framingAspect)
      const verticalFitDistance = radius / Math.tan(verticalFov / 2)
      const horizontalFitDistance = radius / Math.tan(horizontalFov / 2)
      const fitDistance = Math.max(verticalFitDistance, horizontalFitDistance)
      const framingFactor = 0.60
      const distance = fitDistance * framingFactor
      controls.target.copy(center)
      camera.position.copy(center).add(new THREE.Vector3(1, 0, 0).multiplyScalar(distance))
      camera.lookAt(center)
      camera.near = Math.max(0.1, radius / 100)
      camera.far = Math.max(1000, distance + radius * 4)
      camera.updateProjectionMatrix()
      controls.minDistance = Math.max(radius * 0.55, 0.1)
      controls.maxDistance = radius * 5
      controls.update()
      initialView = {
        cameraPosition: camera.position.clone(),
        target: controls.target.clone(),
        minDistance: controls.minDistance,
        maxDistance: controls.maxDistance,
        near: camera.near,
        far: camera.far,
      }
      scene.add(root)
      setResourceStatus('ready')
      callbacks.current.onReady?.({
        select: name => { const object = root.getObjectByName(name); if (object && SELECTABLE_CELESTIAL_NAMES.has(name)) focusObject(object) },
        reset: resetView,
      })
      updateCosmosBillboard = createCosmosBillboard(root)
    }, undefined, error => {
      if (!disposed) {setResourceStatus('error');console.error('[GlobeViewer] globe.glb failed to load', error)}
    })
    frame = requestAnimationFrame(render)
    return () => {
      disposed = true
      controlsRef.current = null
      callbacks.current.onReady?.(null)
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
      controls.dispose()
      scene.remove(fillLight, fillLight.target)
      if (root) {
        scene.remove(root)
        finalColorAttachments.forEach(attachment => attachment.release())
        finalColorAttachments = []
        disposeObject(root)
      }
      renderer.dispose()
      canvas.remove()
    }
  }, [transparent,retry])

  return <>
    <div ref={hostRef} className="globe-viewer" aria-label="Interactive globe model" />
    <ResourceStatus status={resourceStatus} label="天體模型" onRetry={()=>setRetry(v=>v+1)} />
    {import.meta.env.DEV && editorModel && <ModelMaterialEditor pageId="globe-test" model={editorModel} modelName="globe.glb" batchDefaults={MODEL_MATERIAL_PRESETS['globe.glb'].batch} batchColorMode="finalColor" shaderDefaults={MODEL_MATERIAL_PRESETS['globe.glb'].shaderDefaults} />}
  </>
}

export default GlobeViewer