import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createResourceGate } from '../lib/asyncReadiness'
import ResourceStatus from '../edition/ResourceStatus'
import { TOOL_REACTION } from '../edition/config'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import ModelMaterialEditor from '../dev/ModelMaterialEditor'
import { setModelEditorViewport } from '../dev/ModelTransformEditor'
import { prepareModelTransformDraft } from '../dev/modelTransformDraft'
import './MainScene.css'
import { createCosmosBillboard } from './cosmosBillboard'
import { measureHorizontalFraming, applyHorizontalFraming } from './bigTest/modelFraming'
import { createBigInteractionRegistry } from './bigInteractionRegistry'
import { BIG_HOVER_ICON_ASSETS } from './bigHoverIcons'
import PortalBackButton from './PortalBackButton'
import BigCircles from './BigCircles'
import BigSquares from './BigSquares'
import BigSquareField from './BigSquareField'
import BigHanging from './BigHanging'
import BigLeftside from './BigLeftside'
import { applyModelMaterialPreset, MODEL_MATERIAL_PRESETS } from './modelMaterialPresets'
import bigGogoImage from '../../Art/Big/Big-decoration/Big-gogo.PNG'
import bigRoundImage from '../../Art/Big/Big-decoration/Big-round1.PNG'
import bigLineImage from '../../Art/Big/Big-decoration/Big-line.png'

const BIG_MODEL_URL = new URL('../../Mode/Big.glb', import.meta.url).href
const MAX_PIXEL_RATIO = 2
const ENABLE_MINI_COSMOS = false
const FUNCTIONAL_PORTAL_IDS = new Set(['globe', 'telescope', 'book-open1', 'book-close1', 'ball', 'potion'])
const BIG_RENDER_COLOR = {
  brightness: 1.08,
  saturation: 1.03,
}
const FOCUS_BACKDROP_CONFIG = {
  xRatio: -0.12,
  yRatio: 0,
  scale: 1.32,
  focusDuration: 900,
  returnDuration: 1400,
  zIndex: 20,
  focusEasing: 'cubic-bezier(0.33, 1, 0.67, 1)',
  returnEasing: 'cubic-bezier(0.42, 0, 0.58, 1)',
}

const MINI_COSMOS_CONFIG = {
  // Big.glb has no MiniCosmosAnchor; this is the current crystalball bounds center.
  position: new THREE.Vector3(31.6158, 75.3100, 0.5830),
  rotation: new THREE.Euler(0, 0, 0),
  scale: 1,
  width: 1.45,
  height: 0.72,
  opacity: 0.28,
  colors: {
    main: '#2089bf',
    bright: '#49bfe3',
    edge: '#bfefff',
  },
  particleCount: 18,
  animationSpeed: 0.035,
}

const MINI_COSMOS_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const MINI_COSMOS_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uMainColor;
  uniform vec3 uBrightColor;
  uniform vec3 uEdgeColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float radius = length(vec2(p.x, p.y / 0.62));
    float mask = 1.0 - smoothstep(0.35, 1.0, radius);
    float softness = smoothstep(0.02, 0.32, mask);
    float drifting = noise(p * 3.2 + vec2(uTime * 0.7, -uTime * 0.4));
    drifting = mix(drifting, noise(p * 7.0 - vec2(uTime * 0.35)), 0.35);
    float core = 1.0 - smoothstep(0.0, 0.95, radius);
    vec3 color = mix(uMainColor, uBrightColor, drifting * 0.62 + core * 0.28);
    color = mix(color, uEdgeColor, smoothstep(0.60, 1.0, drifting) * mask * 0.22);
    float alpha = mask * (0.18 + drifting * 0.40 + core * 0.25) * uOpacity;
    alpha *= softness;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

function createMiniCosmos() {
  const config = MINI_COSMOS_CONFIG
  const root = new THREE.Group()
  root.name = 'MiniCosmosVFX'
  root.position.copy(config.position)
  root.rotation.copy(config.rotation)
  root.scale.setScalar(config.scale)

  const mainColor = new THREE.Color(config.colors.main)
  const brightColor = new THREE.Color(config.colors.bright)
  const edgeColor = new THREE.Color(config.colors.edge)
  const materials = []
  const layers = [
    { width: 1, height: 1, rotation: 0, opacity: 1 },
    { width: 0.84, height: 0.86, rotation: 0.17, opacity: 0.72 },
    { width: 0.70, height: 0.74, rotation: -0.23, opacity: 0.56 },
    { width: 0.58, height: 0.64, rotation: 0.31, opacity: 0.42 },
  ]

  layers.forEach(layer => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: config.opacity * layer.opacity },
        uMainColor: { value: mainColor },
        uBrightColor: { value: brightColor },
        uEdgeColor: { value: edgeColor },
      },
      vertexShader: MINI_COSMOS_VERTEX_SHADER,
      fragmentShader: MINI_COSMOS_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(config.width * layer.width, config.height * layer.height), material)
    cloud.rotation.z = layer.rotation
    cloud.renderOrder = 20
    root.add(cloud)
    materials.push(material)
  })

  const particlePositions = new Float32Array(config.particleCount * 3)
  const baseParticlePositions = new Float32Array(config.particleCount * 3)
  const particlePhases = new Float32Array(config.particleCount)
  for (let index = 0; index < config.particleCount; index += 1) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random())
    particlePositions[index * 3] = Math.cos(angle) * radius * config.width * 0.42
    particlePositions[index * 3 + 1] = Math.sin(angle) * radius * config.height * 0.42
    particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 0.12
    baseParticlePositions[index * 3] = particlePositions[index * 3]
    baseParticlePositions[index * 3 + 1] = particlePositions[index * 3 + 1]
    baseParticlePositions[index * 3 + 2] = particlePositions[index * 3 + 2]
    particlePhases[index] = Math.random() * Math.PI * 2
  }
  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  const particleMaterial = new THREE.PointsMaterial({
    color: config.colors.edge,
    size: 0.025,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const particles = new THREE.Points(particleGeometry, particleMaterial)
  particles.renderOrder = 21
  root.add(particles)

  root.userData.update = elapsed => {
    materials.forEach((material, index) => {
      material.uniforms.uTime.value = elapsed * config.animationSpeed * (0.78 + index * 0.08)
    })
    particleMaterial.opacity = 0.42 + Math.sin(elapsed * 0.45) * 0.08
    for (let index = 0; index < config.particleCount; index += 1) {
      const phase = particlePhases[index]
      particlePositions[index * 3] = baseParticlePositions[index * 3] + Math.sin(elapsed * 0.18 + phase) * 0.004
      particlePositions[index * 3 + 1] = baseParticlePositions[index * 3 + 1] + Math.cos(elapsed * 0.16 + phase) * 0.004
    }
    particleGeometry.attributes.position.needsUpdate = true
  }

  return root
}

function disposeMiniCosmos(root) {
  root.traverse(object => {
    object.geometry?.dispose()
    if (object.material) {
      for (const material of [].concat(object.material)) material.dispose()
    }
  })
}

function disposeScene(root) {
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

function logModelHierarchy(root) {
  const hierarchy = []
  root.traverse(object => {
    hierarchy.push({
      name: object.name || '(unnamed)',
      type: object.type,
      isMesh: Boolean(object.isMesh),
    })
  })
  console.info('[MainScene] Big.glb object hierarchy', hierarchy)
}

function softenCrystalballGlass(root) {
  const targetName = 'crystalball_ex_m_glass_0'
  const target = root.getObjectByName(targetName)

  if (!target) {
    const related = []
    root.traverse(object => {
      const objectMatches = /crystalball|glass/i.test(object.name)
      const materialMatches = [].concat(object.material || []).some(material => /crystalball|glass/i.test(material?.name || ''))
      if (objectMatches || materialMatches) {
        related.push({
          objectName: object.name || '(unnamed)',
          type: object.type,
          isMesh: Boolean(object.isMesh),
          materialNames: object.isMesh ? [].concat(object.material).map(material => material.name || '(unnamed)') : [],
        })
      }
    })
    console.warn(`[MainScene] ${targetName} was not found. Related crystalball/glass names:`, related)
    return
  }

  if (!target.isMesh) {
    console.warn(`[MainScene] ${targetName} exists but is not a Mesh; no material changed`, target)
    return
  }

  const originalMaterial = target.material
  const adjustedMaterials = [].concat(originalMaterial).map(material => {
    const softened = material.clone()
    softened.color.set(0xeafaff)
    softened.transparent = true
    softened.opacity = 0.18
    softened.metalness = 0
    softened.roughness = 0.16
    if ('transmission' in softened) softened.transmission = 0.04
    if ('ior' in softened) softened.ior = 1.15
    if ('clearcoat' in softened) softened.clearcoat = 0.18
    if ('clearcoatRoughness' in softened) softened.clearcoatRoughness = 0.22
    softened.depthWrite = false
    softened.needsUpdate = true
    return softened
  })
  target.material = Array.isArray(originalMaterial) ? adjustedMaterials : adjustedMaterials[0]
  const adjustedMaterial = adjustedMaterials[0]
  console.info('[MainScene] Crystalball glass material adjusted', JSON.stringify({
    objectName: target.name,
    objectType: target.type,
    materialType: adjustedMaterial.type,
    opacity: adjustedMaterial.opacity,
    roughness: adjustedMaterial.roughness,
    metalness: adjustedMaterial.metalness,
    depthWrite: adjustedMaterial.depthWrite,
    side: adjustedMaterial.side,
    renderOrder: target.renderOrder,
  }))
}

function MainScene({ onResourceStatus, onBack, onPortalSelect, onBigObjectSelect, onOpenIntroduction, onCloseIntroduction, returnedFromEntrance, visitedBigPortals, hasBigIntroduction, presentation, children, navigation, viewportAspect, fitViewport = false, onFocusProgress }) {
  const [resourceStatus,setResourceStatus] = useState('loading')
  const [retry,setRetry] = useState(0)
  const hostRef = useRef(null)
  const [focusedPortalId, setFocusedPortalId] = useState(null)
  const [editorModel, setEditorModel] = useState(null)
  const focusedPortalScreenCenterRef = useRef(null)
  const resourceCallback = useRef(onResourceStatus)
  resourceCallback.current = onResourceStatus
  useEffect(()=>{resourceCallback.current?.(resourceStatus)},[resourceStatus])

  useEffect(() => {
    setResourceStatus('loading')
    setEditorModel(null)
    const host = hostRef.current
    if (!host) return undefined
    host.dataset.status = 'loading'

    const canvas = document.createElement('canvas')
    canvas.style.cssText = `position:absolute;inset:0;z-index:70;display:block;visibility:hidden;width:100%;height:100%;filter:brightness(${BIG_RENDER_COLOR.brightness}) saturate(${BIG_RENDER_COLOR.saturation})`
    host.appendChild(canvas)
    const hoverIcon = document.createElement('div')
    hoverIcon.className = 'big-hover-icon'
    const hoverIconImage = document.createElement('img')
    hoverIconImage.className = 'big-hover-icon-image'
    hoverIconImage.alt = ''
    hoverIconImage.draggable = false
    hoverIcon.appendChild(hoverIconImage)
    document.body.appendChild(hoverIcon)

    const scene = new THREE.Scene()
    scene.background = null
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000)
    let renderer
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }) }
    catch (error) {
      canvas.remove(); hoverIcon.remove(); host.dataset.status = 'error'
      setResourceStatus('error'); console.error('[MainScene] WebGL initialization failed', error)
      return undefined
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
    renderer.setClearColor(0xfdf9ee, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping
    renderer.toneMappingExposure = 1.08

    scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d2cc, 2.25))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(4, 7, 5)
    scene.add(keyLight)

    const controls = new OrbitControls(camera, canvas)
    controls.enabled = false
    canvas.style.pointerEvents = 'none'
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minPolarAngle = 0.16
    controls.maxPolarAngle = Math.PI - 0.16
    const handleLeftsideEditing = event => {
      controls.enabled = !event.detail?.active
    }
    window.addEventListener('layout-editor-editing', handleLeftsideEditing)
    const handleExpandedDocument = event => {
      controls.enabled = !event.detail?.open
    }
    window.addEventListener('expanded-document-open', handleExpandedDocument)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerDown = null
    let hoveredInteractionId = null
    let hoveredIconTargetId = null
    let suppressedHoverTargetId = null
    let pointerIsDown = false

    let modelRoot
    let transformDraft = null
    let interactionRegistry
    let magglassObjects = new WeakSet()
    let miniCosmos
    let updateCosmosBillboard
    let frame = 0
    let disposed = false, failed = false, readyToPresent = false
    const manager = new THREE.LoadingManager()
    const loadController = new AbortController()
    const reportFailure = error => {
      if (disposed || failed) return
      failed = true; controls.enabled = false; canvas.style.pointerEvents = 'none'
      host.dataset.status = 'error'; setResourceStatus('error')
      console.error('[MainScene] Required scene preparation failed', error)
    }
    const readiness = createResourceGate({
      abort: () => { loadController.abort(); manager.abort() }, onError: reportFailure, pauseOnHidden: true,
      onReady: () => { canvas.style.visibility = 'visible'; controls.enabled = true; canvas.style.pointerEvents = 'auto'; host.dataset.status = 'ready'; setResourceStatus('ready') },
    })
    manager.onError = url => readiness.fail(new Error(`Required model dependency failed: ${url}`))
    const contextLost = event => {
      event.preventDefault()
      if (readiness.pending) readiness.fail(new Error('WebGL context lost'))
      else reportFailure(new Error('WebGL context lost'))
    }
    canvas.addEventListener('webglcontextlost', contextLost)
    let presentationFocus = 0
    onFocusProgress?.(host, 0)
    let focusAnimation = null
    let transitionHandoff = null
    let focusedInteractionId = null
    let focusedPortalEntry = null
    let initialView = null
    let focusUiRetreated = false
    const focusUiAnimations = new WeakMap()
    const originalDamping = controls.enableDamping
    let elapsed = 0
    let previousTime = 0
    const toolReactions=[]
    const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion=motionPreference.matches
    const updateMotionPreference=()=>{reducedMotion=motionPreference.matches}
    motionPreference.addEventListener('change',updateMotionPreference)

    let renderWidth = 0, renderHeight = 0
    let horizontalFraming = 0

    const resize = () => {
      const width = viewportAspect && !fitViewport ? Math.min(host.clientWidth, host.clientHeight * viewportAspect) : host.clientWidth
      const height = viewportAspect && !fitViewport ? width / viewportAspect : host.clientHeight
      if (!width || !height) return
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
      const sizeChanged = width !== renderWidth || height !== renderHeight
      const pixelRatioChanged = pixelRatio !== renderer.getPixelRatio()
      if (!sizeChanged && !pixelRatioChanged) return
      if (viewportAspect && !fitViewport) {
        canvas.style.inset = 'auto'
        canvas.style.left = '50%'
        canvas.style.top = '50%'
        canvas.style.transform = 'translate(-50%, -50%)'
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }
      camera.aspect = width / height
      if (fitViewport) {
        camera.fov = fitViewport(width, height, viewportAspect).fov
      }
      camera.updateProjectionMatrix()
      if (pixelRatioChanged) renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)
      renderWidth = width
      renderHeight = height
      applyHorizontalFraming(camera, width, height, horizontalFraming)
    }

    const updatePointer = event => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    const getRaycastIntersections = event => {
      if (!modelRoot || !interactionRegistry) return []
      updatePointer(event)
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObject(modelRoot, true)
    }

    const resolveInteractionHit = intersections => {
      const hit = intersections.find(({ object }) => interactionRegistry.resolve(object))
      return hit ? interactionRegistry.resolve(hit.object) : null
    }

    const getInteractionScreenCenter = entry => {
      const bounds = new THREE.Box3()
      entry.meshTargets.forEach(mesh => bounds.expandByObject(mesh))
      if (bounds.isEmpty()) return null

      camera.updateMatrixWorld()
      const center = bounds.getCenter(new THREE.Vector3()).project(camera)
      if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) return null

      const rect = canvas.getBoundingClientRect()
      return {
        x: rect.left + ((center.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - center.y) / 2) * rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }
    }

    focusedPortalScreenCenterRef.current = () => (
      focusedPortalEntry ? getInteractionScreenCenter(focusedPortalEntry) : null
    )

    const resolveHoverIconTarget = intersections => {
      for (const { object } of intersections) {
        const interaction = interactionRegistry.resolve(object)
        if (interaction) {
          const src = BIG_HOVER_ICON_ASSETS[interaction.id]
          return src ? { id: interaction.id, src } : null
        }
        if (magglassObjects.has(object)) return { id: 'magglass', src: BIG_HOVER_ICON_ASSETS.magglass }
      }
      return null
    }

    const hideHoverIcon = () => hoverIcon.classList.remove('is-visible')

    const showHoverIcon = (target, event) => {
      if (hoverIconImage.dataset.iconSrc !== target.src) {
        hoverIconImage.src = target.src
        hoverIconImage.dataset.iconSrc = target.src
      }
      hoverIcon.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
      hoverIcon.classList.add('is-visible')
    }

    const animateCameraTo = (targetPosition, targetControlsTarget, viewSettings) => {
      if (transitionHandoff) {
        controls.enableDamping = originalDamping
        controls.enabled = true
        transitionHandoff = null
      }
      focusAnimation = {
        startPresentationFocus: presentationFocus,
        endPresentationFocus: focusedInteractionId ? 1 : 0,
        startedAt: performance.now(),
        duration: viewSettings.duration,
        easing: viewSettings.easing,
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

    const transitionFocusUi = focused => {
      if (focused) {
        if (host.querySelector('.layout-editor-stage.is-open, .expanded-document-view')) return
        focusUiRetreated = true
      } else {
        if (!focusUiRetreated) return
        focusUiRetreated = false
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      host.querySelectorAll('[data-focus-retreat]').forEach(element => {
        const direction = element.dataset.focusRetreat
        const rect = element.getBoundingClientRect()
        const computedTransform = getComputedStyle(element).transform
        const matrix = computedTransform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(computedTransform)
        const currentX = matrix.m41
        const currentY = matrix.m42
        const previousAnimation = focusUiAnimations.get(element)
        if (previousAnimation) {
          element.style.transform = computedTransform === 'none' ? '' : computedTransform
          previousAnimation.cancel()
          focusUiAnimations.delete(element)
        }

        const startTransform = element.style.transform || 'none'
        const isLeft = direction === 'left'
        const endX = focused && isLeft ? -(rect.right - currentX + 24) : 0
        const endY = focused && !isLeft ? -(rect.bottom - currentY + 24) : 0
        const endTransform = focused ? `translate3d(${endX}px, ${endY}px, 0px)` : ''
        if (reducedMotion) {
          element.style.transform = endTransform
          return
        }

        const duration = Number(element.dataset.focusRetreatDuration) || (isLeft ? 620 : 560)
        const delay = Number(element.dataset.focusRetreatDelay) || 0
        const anticipation = isLeft
          ? `translate3d(${currentX + 16}px, ${currentY}px, 0px)`
          : `translate3d(${currentX}px, ${currentY + 12}px, 0px)`
        const overshoot = isLeft ? 'translate3d(10px, 0px, 0px)' : 'translate3d(0px, 9px, 0px)'
        const settle = isLeft ? 'translate3d(-2px, 0px, 0px)' : 'translate3d(0px, -2px, 0px)'
        const keyframes = focused
          ? [
              { transform: startTransform, offset: 0, easing: 'ease-out' },
              { transform: anticipation, offset: 0.14, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
              { transform: endTransform, offset: 1 },
            ]
          : [
              { transform: startTransform, offset: 0, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
              { transform: overshoot, offset: 0.88, easing: 'ease-out' },
              { transform: settle, offset: 0.96, easing: 'ease-out' },
              { transform: 'translate3d(0px, 0px, 0px)', offset: 1 },
            ]
        const animation = element.animate(keyframes, {
          duration: focused ? duration : Math.max(500, duration - 30),
          delay,
          easing: 'linear',
          fill: 'forwards',
        })
        focusUiAnimations.set(element, animation)
        animation.onfinish = () => {
          if (focusUiAnimations.get(element) !== animation) return
          element.style.transform = endTransform
          animation.cancel()
          focusUiAnimations.delete(element)
        }
      })

      const backdropGroup = host.querySelector('[data-focus-backdrop]')
      if (!backdropGroup) return
      const computedTransform = getComputedStyle(backdropGroup).transform
      const matrix = computedTransform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(computedTransform)
      const previousAnimation = focusUiAnimations.get(backdropGroup)
      if (previousAnimation) {
        backdropGroup.style.transform = computedTransform === 'none' ? '' : computedTransform
        previousAnimation.cancel()
        focusUiAnimations.delete(backdropGroup)
      }

      const startTransform = backdropGroup.style.transform || 'none'
      const endTransform = focused
        ? `translate3d(${window.innerWidth * FOCUS_BACKDROP_CONFIG.xRatio}px, ${window.innerHeight * FOCUS_BACKDROP_CONFIG.yRatio}px, 0px) scale(${FOCUS_BACKDROP_CONFIG.scale})`
        : ''
      if (focused) backdropGroup.style.zIndex = String(FOCUS_BACKDROP_CONFIG.zIndex)
      if (reducedMotion) {
        backdropGroup.style.transform = endTransform
        if (!focused) backdropGroup.style.zIndex = ''
        return
      }

      const animation = backdropGroup.animate([
        { transform: startTransform, offset: 0 },
        { transform: endTransform || 'translate3d(0px, 0px, 0px)', offset: 1 },
      ], {
        duration: focused ? FOCUS_BACKDROP_CONFIG.focusDuration : FOCUS_BACKDROP_CONFIG.returnDuration,
        easing: focused ? FOCUS_BACKDROP_CONFIG.focusEasing : FOCUS_BACKDROP_CONFIG.returnEasing,
        fill: 'forwards',
      })
      focusUiAnimations.set(backdropGroup, animation)
      animation.onfinish = () => {
        if (focusUiAnimations.get(backdropGroup) !== animation) return
        backdropGroup.style.transform = endTransform
        if (!focused) backdropGroup.style.zIndex = ''
        animation.cancel()
        focusUiAnimations.delete(backdropGroup)
      }
    }

    const focusSmallObject = entry => {
      const bounds = new THREE.Box3()
      entry.meshTargets.forEach(mesh => bounds.expandByObject(mesh))
      if (bounds.isEmpty()) return
      const sphere = bounds.getBoundingSphere(new THREE.Sphere())
      const focusRadius = Math.max(sphere.radius, 0.001)
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)
      const fitDistance = Math.max(
        focusRadius / Math.tan(verticalFov / 2),
        focusRadius / Math.tan(horizontalFov / 2),
      )
      const largeObjectIds = new Set(['chair1', 'chair2'])
      const framingMultiplier = largeObjectIds.has(entry.id) ? 0.90 : 1.15
      const distance = fitDistance * framingMultiplier
      const viewDirection = camera.position.clone().sub(controls.target).normalize()
      if (!Number.isFinite(viewDirection.lengthSq()) || viewDirection.lengthSq() === 0) viewDirection.set(1, 0, 0)
      const screenRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize()
      const target = sphere.center.clone().addScaledVector(screenRight, focusRadius * 0.65)
      const position = target.clone().addScaledVector(viewDirection, distance)
      focusedInteractionId = entry.id
      focusedPortalEntry = entry.type === 'portal' ? entry : null
      transitionFocusUi(true)
      setFocusedPortalId(entry.type === 'portal' ? entry.id : null)
      animateCameraTo(position, target, {
        minDistance: Math.max(focusRadius * 0.55, 0.1),
        maxDistance: Math.max(focusRadius * 5, distance * 3),
        near: Math.max(0.1, focusRadius / 100),
        far: Math.max(1000, distance + focusRadius * 4),
        duration: 900,
        easing: progress => 1 - ((1 - progress) ** 3),
      })
    }

    const resetBigView = () => {
      if (!initialView) return
      focusedInteractionId = null
      focusedPortalEntry = null
      transitionFocusUi(false)
      setFocusedPortalId(null)
      animateCameraTo(initialView.cameraPosition, initialView.target, {
        ...initialView,
        duration: 1400,
        easing: progress => progress * progress * (3 - (2 * progress)),
      })
    }

    const handlePointerMove = event => {
      const intersections = getRaycastIntersections(event)
      const entry = resolveInteractionHit(intersections)
      const interactionId = entry?.id || null
      if (interactionId !== hoveredInteractionId) {
        hoveredInteractionId = interactionId
        canvas.style.cursor = entry ? 'pointer' : ''
      }
      const hoverTarget = resolveHoverIconTarget(intersections)
      hoveredIconTargetId = hoverTarget?.id || null
      if (pointerIsDown) {
        suppressedHoverTargetId = hoveredIconTargetId
        hideHoverIcon()
        return
      }
      if (suppressedHoverTargetId) {
        if (hoveredIconTargetId === suppressedHoverTargetId) {
          hideHoverIcon()
          return
        }
        suppressedHoverTargetId = null
      }
      if (focusedInteractionId || host.querySelector('.layout-editor-stage.is-open, .expanded-document-view') || !hoverTarget) {
        hideHoverIcon()
        return
      }
      showHoverIcon(hoverTarget, event)
    }

    const handleEditorTransform = event => {
      const object = event.detail?.object
      for (const reaction of toolReactions) if (reaction.root === object) {
        reaction.y = object.position.y
        reaction.amount = 0
        reaction.z = object.rotation.z
      }
    }
    if (import.meta.env.DEV) window.addEventListener('model-editor-transform-change', handleEditorTransform)
    const handlePointerDown = event => {
      if (import.meta.env.DEV && document.body.dataset.devEditing === '3d') return
      pointerIsDown = true
      hoveredIconTargetId = resolveHoverIconTarget(getRaycastIntersections(event))?.id || null
      suppressedHoverTargetId = hoveredIconTargetId
      hideHoverIcon()
      pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() }
    }

    const handlePointerUp = event => {
      if (import.meta.env.DEV && document.body.dataset.devEditing === '3d') { pointerDown = null; return }
      const intersections = getRaycastIntersections(event)
      const releaseHoverTarget = resolveHoverIconTarget(intersections)
      pointerIsDown = false
      hoveredIconTargetId = releaseHoverTarget?.id || null
      suppressedHoverTargetId = hoveredIconTargetId
      hideHoverIcon()
      if (!pointerDown) return
      const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y)
      const duration = performance.now() - pointerDown.time
      pointerDown = null
      if (distance <= 6 && duration <= 500) {
        const entry = resolveInteractionHit(intersections)
        if (entry?.type === 'portal') {
          if (FUNCTIONAL_PORTAL_IDS.has(entry.id)) {
            onBigObjectSelect?.(entry.id, getInteractionScreenCenter(entry), () => focusSmallObject(entry))
          } else if (visitedBigPortals.includes(entry.id) && hasBigIntroduction?.(entry.id)) {
            focusSmallObject(entry)
            onOpenIntroduction?.(entry.id)
          } else if (entry.id === returnedFromEntrance) focusSmallObject(entry)
          else onPortalSelect?.(entry.id, getInteractionScreenCenter(entry))
        } else if (entry?.type === 'object') {
          focusSmallObject(entry)
          onOpenIntroduction?.(entry.id)
        }
        else if (!entry && focusedInteractionId) {
          resetBigView()
          onCloseIntroduction?.()
        }
      }
    }

    const handlePointerCancel = () => {pointerDown=null;pointerIsDown=false;hideHoverIcon()}
    const handleEditionReset = () => {resetBigView();onCloseIntroduction?.()}
    window.addEventListener('edition-reset-view',handleEditionReset)
    const handleEditionInspect = event => {
      const entry=interactionRegistry?.entries.find(item=>item.id===event.detail?.id)
      if(!entry?.meshTargets.length)return
      if (entry.type === 'portal' && FUNCTIONAL_PORTAL_IDS.has(entry.id)) {
        onBigObjectSelect?.(entry.id, getInteractionScreenCenter(entry), () => focusSmallObject(entry))
      } else {
        focusSmallObject(entry);onOpenIntroduction?.(entry.id)
      }
    }
    window.addEventListener('edition-inspect-object',handleEditionInspect)
    const handlePointerLeave = () => {
      hoveredInteractionId = null
      hoveredIconTargetId = null
      canvas.style.cursor = ''
      hideHoverIcon()
      if (!pointerIsDown) suppressedHoverTargetId = null
    }

    const render = now => {
      if (disposed || failed) return
      // Loading/compiling must never paint a partially prepared model. Measure
      // again before drawing: layout or DPR may have changed while GLB/GPU work
      // was pending, without its ResizeObserver callback having run yet.
      if (readiness.pending) resize()
      if (!readyToPresent || !host.clientWidth || !host.clientHeight) {
        frame = requestAnimationFrame(render)
        return
      }
      const delta=previousTime?Math.min((now-previousTime)/1000,.1):0
      elapsed += delta
      previousTime = now
      // Only complete tool roots react. The table and multipart globe stay anchored.
      for(const reaction of toolReactions){
        if (import.meta.env.DEV && document.body.dataset.devEditing === '3d') continue
        const target=!reducedMotion&&!pointerIsDown&&!focusedInteractionId&&hoveredInteractionId===reaction.id?1:0
        reaction.amount += (target-reaction.amount)*(1-Math.exp(-TOOL_REACTION.damping*delta))
        if(reducedMotion||pointerIsDown||focusedInteractionId)reaction.amount=0
        reaction.root.position.y=reaction.y+reaction.lift*reaction.amount
        reaction.root.rotation.z=reaction.z+Math.sin(elapsed*2)*TOOL_REACTION.tiltRadians*reaction.amount
      }
      miniCosmos?.userData.update(elapsed)
      if (focusAnimation) {
        const progress = Math.min((performance.now() - focusAnimation.startedAt) / focusAnimation.duration, 1)
        const eased = focusAnimation.easing(progress)
        if (onFocusProgress) {
          presentationFocus = THREE.MathUtils.lerp(focusAnimation.startPresentationFocus, focusAnimation.endPresentationFocus, eased)
          onFocusProgress(host, presentationFocus)
        }
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
        controls.enableDamping = transitionHandoff.dampingWasEnabled ?? originalDamping
        controls.enabled = true
        transitionHandoff = null
      } else if (!focusAnimation) {
        controls.update()
      }
      updateCosmosBillboard?.(camera)
      try {
        if (readiness.pending) {
          // The reset view must match the first presented viewport, including
          // any resize that occurred during asynchronous shader compilation.
          initialView = {
            ...initialView,
            cameraPosition: camera.position.clone(),
            target: controls.target.clone(),
          }
        }
        renderer.render(scene, camera)
        if (import.meta.env.DEV && readiness.pending) {
          const hostRect = host.getBoundingClientRect()
          const canvasRect = canvas.getBoundingClientRect()
          const artboardRect = host.querySelector('.big-test-artboard')?.getBoundingClientRect() ?? hostRect
          const centerNdc = measureHorizontalFraming(modelRoot, camera) * camera.projectionMatrix.elements[0] - camera.projectionMatrix.elements[8]
          const projectedCenterX = canvasRect.left + (centerNdc + 1) * canvasRect.width / 2
          console.info('[Big framing] First complete frame (geometry, not alpha-pixel bounds)', {
            host: hostRect.toJSON(), canvas: canvasRect.toJSON(), artboard: artboardRect.toJSON(),
            projectedCenterX,
            canvasCenterX: canvasRect.left + canvasRect.width / 2,
            artboardCenterX: artboardRect.left + artboardRect.width / 2,
            errorToArtboardPx: projectedCenterX - (artboardRect.left + artboardRect.width / 2),
            orbitTarget: controls.target.toArray(),
            savedTransformEntries: Object.keys(transformDraft?.saved ?? {}).length,
          })
        }
        // GPU programs and the complete model must exist before the first
        // rendered frame is allowed to release the existing curtain.
        if (readyToPresent && readiness.pending) readiness.complete()
      } catch (error) {
        if (readiness.pending) readiness.fail(error); else reportFailure(error)
        return
      }
      frame = requestAnimationFrame(render)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    window.addEventListener('resize', resize)
    resize()
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerCancel)
    canvas.addEventListener('pointerleave', handlePointerLeave)

    // Use an owned fetch: Three's FileLoader deduplicates by URL, so aborting
    // a StrictMode test mount must not reject the next live mount's request.
    fetch(BIG_MODEL_URL, { signal: loadController.signal })
      .then(response => { if (!response.ok) throw new Error(`Big.glb HTTP ${response.status}`); return response.arrayBuffer() })
      .then(buffer => {
        if (disposed || !readiness.pending) throw new DOMException('Scene preparation cancelled', 'AbortError')
        return new GLTFLoader(manager).parseAsync(buffer, new URL('.', BIG_MODEL_URL).href)
      }).then(async gltf => {
      if (disposed || !readiness.pending) {
        disposeScene(gltf.scene)
        return
      }

      try {
        modelRoot = gltf.scene
        logModelHierarchy(modelRoot)
        interactionRegistry = createBigInteractionRegistry(modelRoot)
        const magglassRoot = modelRoot.getObjectByName('magglass')
        magglassRoot?.traverse(object => magglassObjects.add(object))

        const bounds = new THREE.Box3().setFromObject(modelRoot)
        const size = bounds.getSize(new THREE.Vector3())
        const radius = size.length() / 2
        // Local editor drafts used to arrive in a child effect AFTER framing.
        // Restore them first, preserving the existing distance/scale formula.
        if (import.meta.env.DEV) transformDraft = prepareModelTransformDraft(modelRoot, 'big-test', 'Big.glb')
        const center = new THREE.Box3().setFromObject(modelRoot).getCenter(new THREE.Vector3())
        const distance = (radius / Math.tan(THREE.MathUtils.degToRad((fitViewport ? 38 : camera.fov) / 2))) * 1.08
        const viewDirection = new THREE.Vector3(1, 0.68, 1.35).normalize()

        controls.target.copy(center)
        camera.position.copy(center).addScaledVector(viewDirection, distance)
        camera.near = Math.max(0.1, radius / 100)
        camera.far = Math.max(1000, distance + radius * 4)
        camera.updateProjectionMatrix()
        controls.minDistance = Math.max(radius * 0.55, 0.1)
        controls.maxDistance = radius * 5
        controls.update()
        softenCrystalballGlass(modelRoot)
        applyModelMaterialPreset(modelRoot, MODEL_MATERIAL_PRESETS['Big.glb'])
        if (import.meta.env.DEV) { setModelEditorViewport(modelRoot, { camera, scene, canvas, orbit: controls, render: () => { if (!disposed && !failed && !readiness.pending) renderer.render(scene, camera) } }); setEditorModel(modelRoot) }
        if (ENABLE_MINI_COSMOS) {
          miniCosmos = createMiniCosmos()
          const miniCosmosAnchor = modelRoot.getObjectByName('MiniCosmosAnchor')
          if (miniCosmosAnchor) miniCosmosAnchor.add(miniCosmos)
          else modelRoot.add(miniCosmos)
        }
        scene.add(modelRoot)
        scene.updateMatrixWorld(true)
        updateCosmosBillboard = createCosmosBillboard(modelRoot)
        updateCosmosBillboard?.(camera)
        scene.updateMatrixWorld(true)
        horizontalFraming = measureHorizontalFraming(modelRoot, camera)
        if (renderWidth && renderHeight) applyHorizontalFraming(camera, renderWidth, renderHeight, horizontalFraming)
        initialView = {
          cameraPosition: camera.position.clone(),
          target: controls.target.clone(),
          minDistance: controls.minDistance,
          maxDistance: controls.maxDistance,
          near: camera.near,
          far: camera.far,
        }
        interactionRegistry.entries.filter(entry=>TOOL_REACTION.ids.includes(entry.id)).forEach(entry=>{
          entry.matchedRoots.forEach(root=>{
            const bounds=new THREE.Box3().setFromObject(root)
            const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius
            const parentScale=root.parent?.getWorldScale(new THREE.Vector3()).y || 1
            toolReactions.push({id:entry.id,root,y:root.position.y,z:root.rotation.z,lift:radius*TOOL_REACTION.liftRatio/Math.abs(parentScale),amount:0})
          })
        })
        scene.updateMatrixWorld(true)
        await renderer.compileAsync(scene, camera)
        if (!disposed && readiness.pending) readyToPresent = true
      } catch (error) { if (!disposed) readiness.fail(error) }
    }).catch(error => { if (!disposed) readiness.fail(error) })

    frame = requestAnimationFrame(render)

    return () => {
      disposed = true
      readiness.dispose()
      canvas.removeEventListener('webglcontextlost', contextLost)
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerCancel)
      window.removeEventListener('edition-reset-view',handleEditionReset)
      window.removeEventListener('edition-inspect-object',handleEditionInspect)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('layout-editor-editing', handleLeftsideEditing)
      if (import.meta.env.DEV) window.removeEventListener('model-editor-transform-change', handleEditorTransform)
      window.removeEventListener('expanded-document-open', handleExpandedDocument)
      host.querySelectorAll('[data-focus-retreat]').forEach(element => {
        focusUiAnimations.get(element)?.cancel()
        element.style.transform = ''
      })
      const backdropGroup = host.querySelector('[data-focus-backdrop]')
      if (backdropGroup) {
        focusUiAnimations.get(backdropGroup)?.cancel()
        backdropGroup.style.transform = ''
        backdropGroup.style.zIndex = ''
      }
      motionPreference.removeEventListener('change',updateMotionPreference)
      controls.dispose()
      if (modelRoot) {
        scene.remove(modelRoot)
        disposeScene(modelRoot)
      }
      if (miniCosmos) disposeMiniCosmos(miniCosmos)
      renderer.dispose()
      canvas.remove()
      hoverIcon.remove()
    }
  }, [BIG_RENDER_COLOR.brightness, BIG_RENDER_COLOR.saturation, viewportAspect, fitViewport, onFocusProgress, retry])

  const showEnterButton = focusedPortalId && focusedPortalId === returnedFromEntrance

  return (
    <main ref={hostRef} className={`main-scene${presentation ? ' main-scene--big-test' : ''}`} aria-label="The Wizard's Genesis 3D world">
      {presentation || <><div className="big-foundation" aria-hidden="true">
        <div className="big-foundation-composition">
          <img className="big-foundation-gogo" src={bigGogoImage} alt="" />
          <div className="big-focus-backdrop-group" data-focus-backdrop>
            <img className="big-foundation-round" src={bigRoundImage} alt="" />
            <BigSquares />
          </div>
          <img className="big-foundation-line" src={bigLineImage} alt="" />
          <BigCircles />
        </div>
        <BigSquareField />
        <BigHanging />
      </div>
      <BigLeftside /></>}
      {children}
      {navigation ? navigation({ onBack, showEnterButton, onEnter: () => onPortalSelect?.(focusedPortalId, focusedPortalScreenCenterRef.current?.()) }) : <><PortalBackButton onBack={onBack} />
      {showEnterButton && (
        <button className="portal-enter" type="button" onClick={() => onPortalSelect?.(focusedPortalId, focusedPortalScreenCenterRef.current?.())}>
          Enter
        </button>
      )}</>}
      <ResourceStatus status={resourceStatus} label="3D 研究桌模型" showLoading={false} onRetry={() => { setResourceStatus('loading'); setRetry(value => value + 1) }} />
      {import.meta.env.DEV && editorModel && <ModelMaterialEditor pageId="big-test" model={editorModel} modelName="Big.glb" batchDefaults={MODEL_MATERIAL_PRESETS['Big.glb'].batch} />}
    </main>
  )
}

export default MainScene
