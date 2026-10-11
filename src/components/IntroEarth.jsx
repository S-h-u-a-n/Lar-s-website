import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import ModelMaterialEditor from '../dev/ModelMaterialEditor'
import { createEarthMaterialEditorExtension, createEarthShaderEditorState } from '../dev/earthMaterialEditor'
import { applyModelMaterialPreset, MODEL_MATERIAL_PRESETS } from './modelMaterialPresets'
import './IntroEarth.css'

const EARTH_ROTATION_SPEED = 0.018
const EARTH_VIEWPORT_DIAMETER = 1.10
const MAX_PIXEL_RATIO = 1.5
const EARTH_MODEL_URL = new URL('../../Mode/earth-me.glb', import.meta.url).href
const SPEC_GLOSS = 'KHR_materials_pbrSpecularGlossiness'
const EARTH_PRESET = MODEL_MATERIAL_PRESETS['earth-me.glb']
const EARTH_MATERIAL_DEFAULTS = EARTH_PRESET.materials['Sphere_Material002_0 / Material.002']

// Recolor the sampled original texture only; its image and UVs stay untouched.
function softenEarthMaterial(material, editorState) {
  material.color.set(EARTH_MATERIAL_DEFAULTS.color)
  material.opacity = EARTH_MATERIAL_DEFAULTS.opacity
  material.metalness = EARTH_MATERIAL_DEFAULTS.metalness
  material.roughness = EARTH_MATERIAL_DEFAULTS.roughness
  material.emissive?.set(EARTH_MATERIAL_DEFAULTS.emissive)
  if ('emissiveIntensity' in material) material.emissiveIntensity = EARTH_MATERIAL_DEFAULTS.emissiveIntensity
  material.onBeforeCompile = shader => {
    const palette = {
      earthOceanShadow: '#8ed5e4', earthOceanLight: '#b8eaf2',
      earthLandShadow: '#e4ebad', earthLandLight: '#f1e6a6',
      earthHighlight: '#f3edbc',
    }
    for (const [name, color] of Object.entries(palette)) {
      shader.uniforms[name] = { value: new THREE.Color(color) }
    }
    editorState.bindUniforms(shader.uniforms)
    shader.fragmentShader = `${Object.keys(palette).map(name => `uniform vec3 ${name};`).join('\n')}
uniform float earthOceanHueShift;
uniform float earthLandHueShift;
uniform float earthOceanSaturation;
uniform float earthLandSaturation;
uniform float earthOceanBrightness;
uniform float earthLandBrightness;
uniform float earthGreenHueShift;
vec3 earthLinearToSrgb(vec3 color) {
  vec3 low = color * 12.92;
  vec3 high = 1.055 * pow(max(color, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(vec3(0.0031308), color));
}
vec3 earthSrgbToLinear(vec3 color) {
  vec3 low = color / 12.92;
  vec3 high = pow(max((color + 0.055) / 1.055, vec3(0.0)), vec3(2.4));
  return mix(low, high, step(vec3(0.04045), color));
}
vec3 earthRgbToHsv(vec3 color) {
  vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(color.bg, k.wz), vec4(color.gb, k.xy), step(color.b, color.g));
  vec4 q = mix(vec4(p.xyw, color.r), vec4(color.r, p.yzx), step(p.x, color.r));
  float chroma = q.x - min(q.w, q.y);
  float epsilon = 1e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * chroma + epsilon)), chroma / (q.x + epsilon), q.x);
}
vec3 earthHsvToRgb(vec3 color) {
  vec3 p = abs(fract(color.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return color.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), color.y);
}
vec3 earthAdjustPaletteColor(vec3 color, float hueShift, float saturationScale, float brightnessScale) {
  vec3 hsv = earthRgbToHsv(earthLinearToSrgb(color));
  hsv.x = fract(hsv.x + hueShift);
  hsv.y = clamp(hsv.y * saturationScale, 0.0, 1.0);
  hsv.z = max(hsv.z * brightnessScale, 0.0);
  return earthSrgbToLinear(earthHsvToRgb(hsv));
}
${shader.fragmentShader}`.replace('#include <map_fragment>', `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D(map, vMapUv);
  // The sRGB texture is sampled in linear space. Classify perceptual color,
  // including dark water, without carrying its original RGB into the result.
  vec3 source = pow(max(sampledDiffuseColor.rgb, vec3(0.0)), vec3(1.0 / 2.2));
  float brightest = max(source.r, max(source.g, source.b));
  float darkest = min(source.r, min(source.g, source.b));
  float chroma = brightest - darkest;
  float saturation = chroma / max(brightest, 0.001);
  float blueHue = (source.b - source.r) / max(chroma, 0.001);
  float ocean = smoothstep(0.123, 0.687, blueHue)
    * smoothstep(-0.026, -0.008, source.b - source.g)
    * smoothstep(0.045, 0.118, saturation);
  float luminance = dot(source, vec3(0.2126, 0.7152, 0.0722));
  // Separate terrain and water ramps retain source relief and ocean variation.
  float landDetail = smoothstep(0.673, 0.927, luminance);
  float oceanDetail = smoothstep(0.643, 0.850, luminance);
  vec3 land = mix(earthLandShadow, earthLandLight, landDetail);
  vec3 water = mix(earthOceanShadow, earthOceanLight, oceanDetail);
  land = earthAdjustPaletteColor(land, earthLandHueShift, earthLandSaturation, earthLandBrightness);
  water = earthAdjustPaletteColor(water, earthOceanHueShift, earthOceanSaturation, earthOceanBrightness);
  vec3 remapped = mix(land, water, ocean);
  float highlight = smoothstep(0.877, 0.993, luminance);
  remapped = mix(remapped, earthHighlight, highlight * 0.20);
  vec3 hsv = earthRgbToHsv(earthLinearToSrgb(remapped));
  if (hsv.y > 0.001) {
    float greenHueDelta = 1.0 / 3.0 - hsv.x;
    if (greenHueDelta > 0.5) greenHueDelta -= 1.0;
    else if (greenHueDelta < -0.5) greenHueDelta += 1.0;
    hsv.x = fract(hsv.x + clamp(greenHueDelta, -earthGreenHueShift, earthGreenHueShift));
    remapped = earthSrgbToLinear(earthHsvToRgb(hsv));
  }
  diffuseColor *= vec4(remapped, sampledDiffuseColor.a);
#endif
`).replace('#include <opaque_fragment>', `
#ifdef USE_MAP
  // An illustrated, mostly unlit palette prevents colored lighting from
  // turning bright cyan into gray teal. Keep a little lighting for volume.
  outgoingLight = mix(diffuseColor.rgb, outgoingLight, 0.08);
#endif
#include <opaque_fragment>
`)
  }
  material.customProgramCacheKey = () => 'intro-earth-bright-palette-v7'
  material.needsUpdate = true
}

function disposeObject(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set()
  root?.traverse(object => {
    if (!object.isMesh) return
    geometries.add(object.geometry)
    for (const material of [].concat(object.material)) {
      materials.add(material)
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
    }
  })
  geometries.forEach(geometry => geometry.dispose())
  textures.forEach(texture => { texture.dispose(); texture.source?.data?.close?.() })
  materials.forEach(material => material.dispose())
}

function IntroEarth() {
  const hostRef = useRef(null)
  const [editorModel, setEditorModel] = useState(null)
  const earthShaderEditorRef = useRef(null)
  if (!earthShaderEditorRef.current) {
    earthShaderEditorRef.current = createEarthShaderEditorState(EARTH_PRESET.extensionDefaults)
  }
  const earthShaderEditor = earthShaderEditorRef.current
  const earthEditorExtension = useMemo(() => createEarthMaterialEditorExtension(earthShaderEditor), [earthShaderEditor])
  const editorModels = useMemo(() => editorModel ? [{
    id: 'earth-me',
    name: 'earth-me.glb',
    object: editorModel,
    shaderDefaults: { 'Material.002': EARTH_PRESET.shaderDefaults },
    batchDefaults: EARTH_PRESET.batch,
    extensions: [earthEditorExtension],
  }] : [], [editorModel, earthEditorExtension])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    // Each effect owns its canvas. StrictMode must never reuse a context that
    // the previous effect has deliberately lost during cleanup.
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%'
    host.appendChild(canvas)
    host.dataset.status = 'initializing'
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0, 8.4)
    const earthGroup = new THREE.Group()
    // Perspective sphere silhouette: keep diameter at 110% of viewport height.
    const projectedRadius = EARTH_VIEWPORT_DIAMETER * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    earthGroup.scale.setScalar(camera.position.z * projectedRadius / Math.sqrt(1 + projectedRadius ** 2))
    scene.add(earthGroup)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let renderer, observer, earthRoot, frame = 0, previous = 0, disposed = false
    let stage = 'WebGL2 context', reported = false

    const cleanup = () => {
      if (disposed) return
      disposed = true
      cancelAnimationFrame(frame)
      observer?.disconnect()
      reduced.removeEventListener('change', resume)
      document.removeEventListener('visibilitychange', resume)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', resume)
      disposeObject(earthGroup)
      renderer?.dispose()
      renderer?.forceContextLoss()
      canvas.remove()
    }
    const fail = error => {
      if (disposed) return
      // Keep the original exception and failing stage visible; only this layer fails.
      console.error(`[IntroEarth] ${stage} failed`, error)
      host.dataset.status = 'error'
      cleanup()
    }
    const draw = now => {
      frame = 0
      if (disposed || document.hidden || !earthRoot || renderer.getContext().isContextLost()) return
      try {
        stage = 'render'
        const delta = previous ? Math.min((now - previous) / 1000, .1) : 0
        previous = now
        if (!reduced.matches) earthGroup.rotation.y += EARTH_ROTATION_SPEED * delta
        renderer.render(scene, camera)
        host.dataset.status = 'rendered'
        if (!reported && import.meta.env.DEV) {
          console.info('[IntroEarth] rendered', JSON.stringify({ webgl2: true, canvas: [canvas.width, canvas.height], triangles: renderer.info.render.triangles }))
          reported = true
        }
        if (!reduced.matches) frame = requestAnimationFrame(draw)
      } catch (error) { fail(error) }
    }
    function resume() {
      cancelAnimationFrame(frame); frame = 0; previous = 0
      if (!disposed && !document.hidden && earthRoot) frame = requestAnimationFrame(draw)
    }
    function lost(event) {
      event.preventDefault()
      cancelAnimationFrame(frame); frame = 0; previous = 0
      host.dataset.status = 'context-lost'
      console.error('[IntroEarth] WebGL context lost', event.statusMessage)
    }
    const resize = () => {
      if (disposed) return
      const width = host.clientWidth, height = host.clientHeight
      if (!width || !height) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      resume()
    }

    try {
      const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' })
      if (!context || context.isContextLost()) throw new Error('Unable to create a live WebGL2 context')
      if (!context.getShaderPrecisionFormat(context.VERTEX_SHADER, context.HIGH_FLOAT)) {
        throw new Error('WebGL2 returned no shader precision information')
      }
      stage = 'WebGLRenderer initialization'
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true })
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
      scene.add(new THREE.HemisphereLight(0xf1f5ee, 0xa3c3bf, 2.2))
      const keyLight = new THREE.DirectionalLight(0xf5f3e8, 0.5)
      keyLight.position.set(-3, 4, 5)
      scene.add(keyLight)
      resize()
      observer = new ResizeObserver(resize)
      observer.observe(host)
      reduced.addEventListener('change', resume)
      document.addEventListener('visibilitychange', resume)
      canvas.addEventListener('webglcontextlost', lost)
      canvas.addEventListener('webglcontextrestored', resume)

      // Local compatibility for this model's diffuse-only legacy material.
      // Read its original embedded JPEG; do not rewrite or convert the GLB.
      const loader = new GLTFLoader().register(parser => ({
        name: SPEC_GLOSS,
        extendMaterialParams(index, params) {
          const extension = parser.json.materials[index].extensions?.[SPEC_GLOSS]
          if (!extension) return null
          params.roughness = 1
          params.metalness = 0
          if (extension.diffuseFactor) {
            params.color.fromArray(extension.diffuseFactor)
            params.opacity = extension.diffuseFactor[3]
          }
          return extension.diffuseTexture
            ? parser.assignTexture(params, 'map', extension.diffuseTexture, THREE.SRGBColorSpace)
            : Promise.resolve()
        },
      }))
      stage = 'GLB load/parse'
      loader.loadAsync(EARTH_MODEL_URL).then(gltf => {
        if (disposed) { disposeObject(gltf.scene); return }
        earthRoot = gltf.scene
        stage = 'model bounds'
        // The source hierarchy has a 100x authoring scale (diameter ~200).
        const box = new THREE.Box3().setFromObject(earthRoot)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const radius = Math.max(size.x, size.y, size.z) / 2
        if (!Number.isFinite(radius) || radius <= 0) throw new Error('Earth mesh has invalid bounds')
        earthRoot.scale.multiplyScalar(1 / radius)
        earthRoot.position.sub(center.multiplyScalar(1 / radius))
        earthRoot.traverse(object => {
          if (object.isMesh) [].concat(object.material).forEach(material => softenEarthMaterial(material, earthShaderEditor))
        })
        applyModelMaterialPreset(earthRoot, EARTH_PRESET)
        earthGroup.add(earthRoot)
        if (import.meta.env.DEV) setEditorModel(earthRoot)
        if (import.meta.env.DEV) {
          let meshes = 0, textured = 0
          earthRoot.traverse(object => { if (object.isMesh) { meshes++; if (object.material.map) textured++ } })
          console.info('[IntroEarth] GLB ready', JSON.stringify({ meshes, textured, sourceDiameter: radius * 2 }))
        }
        resume()
      }).catch(fail)
    } catch (error) { fail(error) }
    return cleanup
  }, [])

  return <>
    <div ref={hostRef} className="intro-earth" aria-hidden="true" />
    {import.meta.env.DEV && <ModelMaterialEditor models={editorModels} />}
  </>
}

export default IntroEarth
