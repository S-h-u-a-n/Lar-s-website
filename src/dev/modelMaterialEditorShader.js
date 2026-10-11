import * as THREE from 'three'

const EDITOR_SHADER_MARKER = 'model-material-editor-v1'
const shaderRecords = new WeakMap()

const DEFAULT_VALUES = {
  finalHueShift: 0,
  finalSaturation: 1,
  finalBrightness: 1,
  finalTint: '#ffffff',
  finalTintMix: 0,
}

const COLOR_FUNCTIONS = `
vec3 editorLinearToSrgb(vec3 color) {
  vec3 low = color * 12.92;
  vec3 high = 1.055 * pow(max(color, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(vec3(0.0031308), color));
}
vec3 editorSrgbToLinear(vec3 color) {
  vec3 low = color / 12.92;
  vec3 high = pow(max((color + 0.055) / 1.055, vec3(0.0)), vec3(2.4));
  return mix(low, high, step(vec3(0.04045), color));
}
vec3 editorRgbToHsv(vec3 color) {
  vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(color.bg, k.wz), vec4(color.gb, k.xy), step(color.b, color.g));
  vec4 q = mix(vec4(p.xyw, color.r), vec4(color.r, p.yzx), step(p.x, color.r));
  float chroma = q.x - min(q.w, q.y);
  float epsilon = 1e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * chroma + epsilon)), chroma / (q.x + epsilon), q.x);
}
vec3 editorHsvToRgb(vec3 color) {
  vec3 p = abs(fract(color.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return color.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), color.y);
}
`

export function isCustomShaderMaterial(material) {
  return Boolean(material?.isShaderMaterial || material?.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile)
}

export function transformBatchColor(color, { hueShift = 0, saturation = 1, brightness = 1 } = {}) {
  if (!color?.isColor) return color
  const linearToSrgb = value => value <= 0.0031308 ? value * 12.92 : 1.055 * (Math.max(value, 0) ** (1 / 2.4)) - 0.055
  const hsv = rgbToHsv({
    r: linearToSrgb(color.r),
    g: linearToSrgb(color.g),
    b: linearToSrgb(color.b),
  })
  const [red, green, blue] = hsvToRgb({
    h: (hsv.h + hueShift + 360) % 360,
    s: Math.max(0, Math.min(1, hsv.s * saturation)),
    v: hsv.v * brightness,
  })
  return color.clone().setRGB(red, green, blue, THREE.SRGBColorSpace)
}

function rgbToHsv({ r, g, b }) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h = ((h * 60) + 360) % 360
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max }
}

function hsvToRgb({ h, s, v }) {
  const chroma = v * s
  const section = ((h % 360) + 360) % 360 / 60
  const x = chroma * (1 - Math.abs((section % 2) - 1))
  const m = v - chroma
  let rgb
  if (section < 1) rgb = [chroma, x, 0]
  else if (section < 2) rgb = [x, chroma, 0]
  else if (section < 3) rgb = [0, chroma, x]
  else if (section < 4) rgb = [0, x, chroma]
  else if (section < 5) rgb = [x, 0, chroma]
  else rgb = [chroma, 0, x]
  return rgb.map(channel => channel + m)
}

export function attachFinalColorControls(material, initialValues = {}, { includeBuiltIn = false } = {}) {
  if (!isCustomShaderMaterial(material) && !(includeBuiltIn && material?.isMaterial)) return null

  let record = shaderRecords.get(material)
  if (record) {
    record.references += 1
    return createAttachment(material, record)
  }

  const originalOnBeforeCompile = material.onBeforeCompile
  const originalProgramCacheKey = material.customProgramCacheKey
  record = {
    defaults: { ...DEFAULT_VALUES, ...initialValues },
    values: { ...DEFAULT_VALUES, ...initialValues },
    uniforms: null,
    supportsFinalColor: false,
    onUpdate: null,
    references: 1,
    originalOnBeforeCompile,
    originalProgramCacheKey,
    wrappedOnBeforeCompile: null,
    wrappedProgramCacheKey: null,
  }

  record.wrappedOnBeforeCompile = function (shader, renderer) {
    record.originalOnBeforeCompile.call(this, shader, renderer)

    const uniforms = {
      editorFinalHueShift: { value: record.values.finalHueShift / 360 },
      editorFinalSaturation: { value: record.values.finalSaturation },
      editorFinalBrightness: { value: record.values.finalBrightness },
      editorFinalTint: { value: new THREE.Color(record.values.finalTint) },
      editorFinalTintMix: { value: record.values.finalTintMix },
    }
    Object.assign(shader.uniforms, uniforms)
    record.uniforms = uniforms

    shader.fragmentShader = `
uniform float editorFinalHueShift;
uniform float editorFinalSaturation;
uniform float editorFinalBrightness;
uniform vec3 editorFinalTint;
uniform float editorFinalTintMix;
${COLOR_FUNCTIONS}
${shader.fragmentShader}`

    const opaqueFragment = '#include <opaque_fragment>'
    record.supportsFinalColor = shader.fragmentShader.includes(opaqueFragment)
    record.onUpdate?.()
    if (!record.supportsFinalColor) return

    shader.fragmentShader = shader.fragmentShader.replace(opaqueFragment, `
  vec3 editorFinalColor = editorLinearToSrgb(outgoingLight);
  vec3 editorFinalHsv = editorRgbToHsv(editorFinalColor);
  editorFinalHsv.x = fract(editorFinalHsv.x + editorFinalHueShift);
  editorFinalHsv.y = clamp(editorFinalHsv.y * editorFinalSaturation, 0.0, 1.0);
  editorFinalHsv.z = max(editorFinalHsv.z * editorFinalBrightness, 0.0);
  editorFinalColor = editorHsvToRgb(editorFinalHsv);
  editorFinalColor = mix(editorFinalColor, editorLinearToSrgb(editorFinalTint), clamp(editorFinalTintMix, 0.0, 1.0));
  outgoingLight = editorSrgbToLinear(editorFinalColor);
${opaqueFragment}`)
  }

  record.wrappedProgramCacheKey = function () {
    return `${record.originalProgramCacheKey.call(this)}:${EDITOR_SHADER_MARKER}`
  }

  material.onBeforeCompile = record.wrappedOnBeforeCompile
  material.customProgramCacheKey = record.wrappedProgramCacheKey
  material.needsUpdate = true
  shaderRecords.set(material, record)
  return createAttachment(material, record)
}

function createAttachment(material, record) {
  let released = false
  return {
    state: record,
    release() {
      if (released) return
      released = true
      record.references -= 1
      if (record.references > 0) return
      if (material.onBeforeCompile === record.wrappedOnBeforeCompile) {
        material.onBeforeCompile = record.originalOnBeforeCompile
        material.customProgramCacheKey = record.originalProgramCacheKey
        material.needsUpdate = true
      }
      shaderRecords.delete(material)
    },
  }
}

export function setFinalColorValue(state, key, value) {
  state.values[key] = value
  if (!state.uniforms) return

  const uniformNames = {
    finalHueShift: 'editorFinalHueShift',
    finalSaturation: 'editorFinalSaturation',
    finalBrightness: 'editorFinalBrightness',
    finalTint: 'editorFinalTint',
    finalTintMix: 'editorFinalTintMix',
  }
  const uniform = state.uniforms[uniformNames[key]]
  if (!uniform) return
  if (key === 'finalTint') uniform.value.set(value)
  else uniform.value = key === 'finalHueShift' ? value / 360 : value
}