import { useEffect, useId, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { createPortal } from 'react-dom'
import './ModelMaterialEditor.css'
import ModelTransformEditor from './ModelTransformEditor'
import { closeDevEditor, useIsDevEditorActive, useRegisterDevEditor } from './devEditorStore'
import { attachFinalColorControls, setFinalColorValue, transformBatchColor } from './modelMaterialEditorShader'

const EMPTY_MODELS = []
const BATCH_DEFAULTS = {
  hueShift: 0,
  saturation: 1,
  brightness: 1,
  opacity: 1,
  roughness: 0.5,
  roughnessApply: false,
  metalness: 0,
  metalnessApply: false,
  emissiveIntensity: 1,
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function collectMaterials(models) {
  const entries = []
  for (const model of models) {
    if (!model?.object?.traverse) continue
    model.object.traverse(mesh => {
      if (!mesh.isMesh) return
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material, materialIndex) => {
        if (!material) return
        entries.push({
          key: `${model.id}:${mesh.uuid}:${materialIndex}`,
          model,
          mesh,
          material,
          materialIndex,
        })
      })
    })
  }
  return entries
}

function snapshotMaterial(material) {
  return {
    color: material.color?.clone?.() ?? null,
    opacity: material.opacity,
    transparent: material.transparent,
    roughness: material.roughness,
    metalness: material.metalness,
    emissive: material.emissive?.clone?.() ?? null,
    emissiveIntensity: material.emissiveIntensity,
    map: material.map,
  }
}

function restoreMaterial(material, snapshot) {
  if (!snapshot) return
  if (snapshot.color && material.color?.copy) material.color.copy(snapshot.color)
  if (snapshot.opacity !== undefined) material.opacity = snapshot.opacity
  if (snapshot.transparent !== undefined) material.transparent = snapshot.transparent
  if (snapshot.roughness !== undefined) material.roughness = snapshot.roughness
  if (snapshot.metalness !== undefined) material.metalness = snapshot.metalness
  if (snapshot.emissive && material.emissive?.copy) material.emissive.copy(snapshot.emissive)
  if (snapshot.emissiveIntensity !== undefined) material.emissiveIntensity = snapshot.emissiveIntensity
  if (snapshot.map !== undefined && material.map !== snapshot.map) {
    material.map = snapshot.map
    material.needsUpdate = true
  }
  material.needsUpdate = true
}

function colorHex(color) {
  return color?.isColor ? `#${color.getHexString(THREE.SRGBColorSpace)}` : '#ffffff'
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16)
  return { r: ((value >> 16) & 255) / 255, g: ((value >> 8) & 255) / 255, b: (value & 255) / 255 }
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

function writeMaterialColor(material, rgb) {
  material.color.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace)
}

function materialName(material, index) {
  return material.name || `Material ${index + 1}`
}

function getExtensionControls(entry) {
  return (entry.model.extensions || []).flatMap(extension => {
    if (extension.appliesTo && !extension.appliesTo(entry)) return []
    const definitions = typeof extension.controls === 'function'
      ? extension.controls(entry)
      : extension.controls || []
    return definitions.map(definition => ({
      ...definition,
      extensionId: extension.id,
      extensionLabel: extension.label || extension.id,
      stateKey: `${entry.key}:${extension.id}:${definition.id}`,
    }))
  })
}

function initialControlValue(control) {
  if (control.initialValue !== undefined) return control.initialValue
  if (control.getValue) return control.getValue()
  return control.value
}

function RangeControl({ label, value, min, max, step, onChange, disabled = false, suffix = '' }) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : min
  return (
    <label className="model-editor-range">
      <span>{label}</span>
      <span className="model-editor-range-fields">
        <input type="range" min={min} max={max} step={step} value={safeValue} disabled={disabled} onChange={event => onChange(Number(event.target.value))} />
        <span className="model-editor-number-wrap">
          <input type="number" min={min} max={max} step={step} value={safeValue} disabled={disabled} onChange={event => {
            if (event.target.value !== '') onChange(Number(event.target.value))
          }} />
          {suffix && <small>{suffix}</small>}
        </span>
      </span>
    </label>
  )
}

function ColorControl({ label, value, onChange }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const valid = /^#[\da-fA-F]{6}$/.test(draft)
  return (
    <label className="model-editor-color">
      <span>{label}</span>
      <span className="model-editor-color-fields">
        <input type="color" value={valid ? draft : value} onChange={event => {
          setDraft(event.target.value)
          onChange(event.target.value)
        }} />
        <input type="text" value={draft} spellCheck="false" aria-label={`${label} HEX`} onChange={event => {
          setDraft(event.target.value)
          if (/^#[\da-fA-F]{6}$/.test(event.target.value)) onChange(event.target.value)
        }} onBlur={() => { if (!/^#[\da-fA-F]{6}$/.test(draft)) setDraft(value) }} />
      </span>
    </label>
  )
}

function ModelMaterialEditor({ pageId = 'model', models: registeredModels, model, modelName, extensions, batchDefaults, batchColorMode, shaderDefaults }) {
  const models = useMemo(() => registeredModels ?? (model ? [{
    id: model.uuid || 'model',
    name: modelName || model.name || model.type || 'Model',
    object: model,
    extensions: extensions || [],
    batchDefaults,
    batchColorMode,
    shaderDefaults,
  }] : EMPTY_MODELS), [registeredModels, model, modelName, extensions, batchDefaults, batchColorMode, shaderDefaults])
  const entries = useMemo(() => collectMaterials(models), [models])
  const editorId = useId()
  useRegisterDevEditor('3d', editorId, models.length > 0)
  const open = useIsDevEditorActive(editorId)
  const [collapsed, setCollapsed] = useState(false)
  const [modelId, setModelId] = useState('')
  const [meshUuid, setMeshUuid] = useState('')
  const [materialIndex, setMaterialIndex] = useState(0)
  const [selectionScope, setSelectionScope] = useState(models[0]?.batchDefaults?.scope || 'currentMaterial')
  const [batchByModel, setBatchByModel] = useState({})
  const [extensionValues, setExtensionValues] = useState({})
  const [output, setOutput] = useState('')
  const [revision, setRevision] = useState(0)
  const transformConfig = useRef({})
  const materialDraftDirty = useRef(false)
  const snapshots = useRef(new WeakMap())
  const extensionInitials = useRef(new Map())
  const shaderStates = useRef(new Map())
  const attachments = useRef([])
  const panelRef = useRef(null)
  const dragRef = useRef(null)
  const [position, setPosition] = useState(null)

  useEffect(() => {
    if (!models.some(model => model.id === modelId)) setModelId(models[0]?.id || '')
  }, [models, modelId])

  const modelEntries = entries.filter(entry => entry.model.id === modelId)
  const meshes = [...new Map(modelEntries.map(entry => [entry.mesh.uuid, entry.mesh])).values()]
  useEffect(() => {
    if (!meshes.some(mesh => mesh.uuid === meshUuid)) setMeshUuid(meshes[0]?.uuid || '')
  }, [meshes, meshUuid])

  const meshEntries = modelEntries.filter(entry => entry.mesh.uuid === meshUuid)
  const materialEntries = [...new Map(meshEntries.map(entry => [entry.materialIndex, entry])).values()]
  useEffect(() => {
    if (!materialEntries.some(entry => entry.materialIndex === materialIndex)) {
      setMaterialIndex(materialEntries[0]?.materialIndex ?? 0)
    }
  }, [materialEntries, materialIndex])

  const selectedEntry = materialEntries.find(entry => entry.materialIndex === materialIndex) || materialEntries[0]
  const selectedMaterial = selectedEntry?.material
  const selectedSnapshot = selectedMaterial ? snapshots.current.get(selectedMaterial) : null
  const selectedShaderState = selectedMaterial ? shaderStates.current.get(selectedMaterial) : null
  const selectedExtensions = selectedEntry ? getExtensionControls(selectedEntry) : []
  const selectedColorHex = colorHex(selectedMaterial?.color)
  const selectedHsv = rgbToHsv(hexToRgb(selectedColorHex))
  const hasMapProperty = Boolean(selectedMaterial && 'map' in selectedMaterial)
  const initialMap = selectedSnapshot?.map
  const selectedModel = models.find(model => model.id === modelId)
  const modelBatchDefaults = { ...BATCH_DEFAULTS, ...(selectedModel?.batchDefaults || {}) }
  const batchValues = { ...modelBatchDefaults, ...(batchByModel[modelId] || {}) }
  const batchTargets = selectionScope === 'allMaterials'
    ? modelEntries
    : selectionScope === 'currentMesh'
      ? meshEntries
      : selectedEntry ? [selectedEntry] : []

  useEffect(() => {
    const uniqueMaterials = [...new Set(entries.map(entry => entry.material))]
    const nextShaderStates = new Map()
    const nextAttachments = []
    for (const entry of entries) {
      if (!snapshots.current.has(entry.material)) snapshots.current.set(entry.material, snapshotMaterial(entry.material))
    }
    for (const material of uniqueMaterials) {
      const modelEntry = entries.find(entry => entry.material === material)
      const modelShaderDefaults = modelEntry?.model.shaderDefaults
      const shaderKey = `${modelEntry?.mesh.name} / ${material.name}`
      const materialShaderDefaults = modelEntry?.model.batchColorMode === 'finalColor' && material.map
        ? modelShaderDefaults?.[shaderKey] || {}
        : modelShaderDefaults?.[material.name]
          || modelShaderDefaults?.[modelEntry?.key]
          || {}
      const attachment = attachFinalColorControls(material, materialShaderDefaults, {
        includeBuiltIn: modelEntry?.model.batchColorMode === 'finalColor' && Boolean(material.map),
      })
      if (attachment) {
        attachment.state.onUpdate = () => setRevision(value => value + 1)
        nextShaderStates.set(material, attachment.state)
        nextAttachments.push(attachment)
      }
    }
    shaderStates.current = nextShaderStates
    attachments.current = nextAttachments
    setRevision(value => value + 1)
    setExtensionValues(current => {
      const next = { ...current }
      for (const entry of entries) {
        for (const control of getExtensionControls(entry)) {
          if (!extensionInitials.current.has(control.stateKey)) extensionInitials.current.set(control.stateKey, initialControlValue(control))
          if (next[control.stateKey] === undefined) next[control.stateKey] = extensionInitials.current.get(control.stateKey)
        }
      }
      return next
    })

    return () => {
      for (const entry of entries) restoreMaterial(entry.material, snapshots.current.get(entry.material))
      for (const state of new Set(nextShaderStates.values())) resetShaderState(state)
      for (const entry of entries) {
        for (const control of getExtensionControls(entry)) {
          const initialValue = extensionInitials.current.get(control.stateKey)
          if (initialValue !== undefined) control.setValue(initialValue)
        }
      }
      nextAttachments.forEach(attachment => attachment.release())
      for (const state of nextShaderStates.values()) state.onUpdate = null
      shaderStates.current = new Map()
      attachments.current = []
    }
  }, [entries])

  useEffect(() => {
    for (const item of models) {
      const key = `genesis:model-editor:${pageId}:${item.name}:material-v1`
      try {
        const saved = JSON.parse(localStorage.getItem(key) || 'null')
        if (!saved) continue
        if (typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Unknown draft format')
        for (const entry of entries.filter(entry => entry.model.id === item.id)) {
          const materialKey = `${entry.mesh.name || 'Unnamed Mesh'} / ${materialName(entry.material, entry.materialIndex)}`
          const value = saved.materials?.[materialKey]
          if (!value) continue
          for (const field of ['opacity','roughness','metalness','emissiveIntensity']) if (Number.isFinite(value[field]) && field in entry.material) entry.material[field] = value[field]
          if (Number.isFinite(value.opacity)) entry.material.transparent = value.opacity < 1 || Boolean(snapshots.current.get(entry.material)?.transparent)
          for (const field of ['color','emissive']) if (/^#[0-9a-f]{6}$/i.test(value[field]) && entry.material[field]?.isColor) entry.material[field].set(value[field])
          if (value.texture?.enabled === false && 'map' in entry.material) entry.material.map = null
          const shader = shaderStates.current.get(entry.material)
          if (shader) for (const [field, value] of Object.entries(saved.shader?.[materialKey]?.finalColor || {})) setFinalColorValue(shader, field, value)
          for (const control of getExtensionControls(entry)) {
            const value = saved.shader?.[materialKey]?.extensions?.[control.extensionId]?.[control.id]
            if (value !== undefined) { control.setValue(value); setExtensionValues(current => ({...current, [control.stateKey]: value})) }
          }
          entry.material.needsUpdate = true
        }
        if (saved.batch) { setSelectionScope(saved.batch.scope || 'currentMaterial'); setBatchByModel(current => ({...current, [item.id]: saved.batch})) }
      } catch (error) { console.warn('[3D Editor] Material draft preserved', error) }
    }
  }, [entries, pageId])
  useEffect(() => {
    if (!materialDraftDirty.current || !selectedModel) return
    try {
      const key = `genesis:model-editor:${pageId}:${selectedModel.name}:material-v1`
      const saved = JSON.parse(localStorage.getItem(key) || '{}')
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Unknown draft format')
      const config = createConfiguration()
      localStorage.setItem(key, JSON.stringify({ ...saved, ...config, materials: {...saved.materials, ...config.materials}, shader: {...saved.shader, ...config.shader} }))
    } catch (error) { console.warn('[3D Editor] Cannot save material draft', error) }
    materialDraftDirty.current = false
  }, [revision])

  if (!import.meta.env.DEV || models.length === 0) return null

  function refresh() {
    materialDraftDirty.current = true
    setRevision(value => value + 1)
  }

  function applyBatchToEntry(entry, values) {
    const material = entry.material
    const snapshot = snapshots.current.get(material)
    if (!snapshot) return
    const shaderState = shaderStates.current.get(material)
    const usesPresetBatch = entry.model.batchColorMode === 'finalColor'
    const usesFinalColorBatch = entry.model.batchColorMode === 'finalColor' && Boolean(material.map) && Boolean(shaderState)
    const defaults = { ...BATCH_DEFAULTS, ...(entry.model.batchDefaults || {}) }
    const effective = {
      hueShift: values.hueShift - defaults.hueShift,
      saturation: defaults.saturation ? values.saturation / defaults.saturation : values.saturation,
      brightness: defaults.brightness ? values.brightness / defaults.brightness : values.brightness,
      opacity: defaults.opacity ? values.opacity / defaults.opacity : values.opacity,
      emissiveIntensity: defaults.emissiveIntensity ? values.emissiveIntensity / defaults.emissiveIntensity : values.emissiveIntensity,
      roughness: values.roughness,
      roughnessApply: values.roughnessApply,
      metalness: values.metalness,
      metalnessApply: values.metalnessApply,
    }

    if (!usesPresetBatch && snapshot.color && material.color?.isColor && (
      effective.hueShift !== 0 || effective.saturation !== 1 || effective.brightness !== 1
    )) {
      material.color.copy(transformBatchColor(snapshot.color, effective))
    }
    if (usesFinalColorBatch) {
      setFinalColorValue(shaderState, 'finalHueShift', shaderState.defaults.finalHueShift + effective.hueShift)
      setFinalColorValue(shaderState, 'finalSaturation', shaderState.defaults.finalSaturation * effective.saturation)
      setFinalColorValue(shaderState, 'finalBrightness', shaderState.defaults.finalBrightness * effective.brightness)
    }

    if (snapshot.opacity !== undefined && effective.opacity !== 1) {
      material.opacity = clamp(snapshot.opacity * effective.opacity, 0, 1)
      material.transparent = material.opacity < 1 || Boolean(snapshot.transparent)
      if (material.transparent !== snapshot.transparent) material.needsUpdate = true
    }
    if (typeof snapshot.roughness === 'number' && typeof material.roughness === 'number') {
      if (values.roughnessApply) material.roughness = values.roughness
    }
    if (typeof snapshot.metalness === 'number' && typeof material.metalness === 'number') {
      if (values.metalnessApply) material.metalness = values.metalness
    }
    if (typeof snapshot.emissiveIntensity === 'number' && typeof material.emissiveIntensity === 'number' && effective.emissiveIntensity !== 1) {
      material.emissiveIntensity = snapshot.emissiveIntensity * effective.emissiveIntensity
    }
  }

  function updateBatchValue(property, value) {
    const nextValues = { ...batchValues, [property]: value }
    if ((property === 'roughnessApply' || property === 'metalnessApply') && value === false) {
      const materialProperty = property === 'roughnessApply' ? 'roughness' : 'metalness'
      batchTargets.forEach(entry => {
        const snapshot = snapshots.current.get(entry.material)
        if (typeof snapshot?.[materialProperty] === 'number') entry.material[materialProperty] = snapshot[materialProperty]
      })
    }
    if (property === 'opacity' && value === modelBatchDefaults.opacity && batchValues.opacity !== modelBatchDefaults.opacity) {
      batchTargets.forEach(entry => {
        const snapshot = snapshots.current.get(entry.material)
        if (snapshot?.opacity !== undefined) {
          entry.material.opacity = snapshot.opacity
          entry.material.transparent = snapshot.transparent
          entry.material.needsUpdate = true
        }
      })
    }
    if (property === 'emissiveIntensity' && value === modelBatchDefaults.emissiveIntensity && batchValues.emissiveIntensity !== modelBatchDefaults.emissiveIntensity) {
      batchTargets.forEach(entry => {
        const snapshot = snapshots.current.get(entry.material)
        if (typeof snapshot?.emissiveIntensity === 'number') entry.material.emissiveIntensity = snapshot.emissiveIntensity
      })
    }
    setBatchByModel(current => ({ ...current, [modelId]: nextValues }))
    batchTargets.forEach(entry => applyBatchToEntry(entry, nextValues))
    refresh()
  }

  function updateMaterialNumber(property, value) {
    if (!selectedMaterial) return
    selectedMaterial[property] = value
    if (property === 'opacity') {
      selectedMaterial.transparent = value < 1 || Boolean(selectedSnapshot?.transparent)
      selectedMaterial.needsUpdate = true
    }
    refresh()
  }

  function updateMaterialColor(hex) {
    if (!selectedMaterial?.color) return
    selectedMaterial.color.set(hex)
    refresh()
  }

  function updateColorHsv(patch) {
    if (!selectedMaterial?.color) return
    const next = hsvToRgb({ ...selectedHsv, ...patch })
    writeMaterialColor(selectedMaterial, next)
    refresh()
  }

  function updateTexture(enabled) {
    if (!selectedMaterial || !selectedSnapshot || !hasMapProperty) return
    selectedMaterial.map = enabled ? initialMap : null
    selectedMaterial.needsUpdate = true
    refresh()
  }

  function updateExtension(control, value) {
    control.setValue(value)
    setExtensionValues(current => ({ ...current, [control.stateKey]: value }))
  }

  function resetShaderState(state) {
    for (const [key, value] of Object.entries(state.defaults)) setFinalColorValue(state, key, value)
  }

  function resetEntry(entry) {
    restoreMaterial(entry.material, snapshots.current.get(entry.material))
    const shaderState = shaderStates.current.get(entry.material)
    if (shaderState) resetShaderState(shaderState)
    for (const control of getExtensionControls(entry)) {
      const initialValue = extensionInitials.current.get(control.stateKey) ?? initialControlValue(control)
      control.setValue(initialValue)
      setExtensionValues(current => ({ ...current, [control.stateKey]: initialValue }))
    }
  }

  function resetCurrent() {
    batchTargets.forEach(resetEntry)
    setBatchByModel(current => ({ ...current, [modelId]: { ...modelBatchDefaults } }))
    refresh()
  }

  function resetAll() {
    const resetStates = new Set()
    for (const entry of entries) {
      restoreMaterial(entry.material, snapshots.current.get(entry.material))
      const shaderState = shaderStates.current.get(entry.material)
      if (shaderState && !resetStates.has(shaderState)) {
        resetShaderState(shaderState)
        resetStates.add(shaderState)
      }
      for (const control of getExtensionControls(entry)) {
        const initialValue = extensionInitials.current.get(control.stateKey) ?? initialControlValue(control)
        control.setValue(initialValue)
        setExtensionValues(current => ({ ...current, [control.stateKey]: initialValue }))
      }
    }
    setBatchByModel(Object.fromEntries(models.map(model => [model.id, { ...BATCH_DEFAULTS, ...(model.batchDefaults || {}) }])))
    refresh()
  }

  function createConfiguration() {
    const materials = {}
    const shader = {}
    for (const entry of entries) {
      const material = entry.material
      const key = `${entry.mesh.name || 'Unnamed Mesh'} / ${materialName(material, entry.materialIndex)}`
      const values = {
        mesh: entry.mesh.name || 'Unnamed Mesh',
        material: materialName(material, entry.materialIndex),
        type: material.type,
      }
      if (material.color?.isColor) values.color = colorHex(material.color)
      if (material.opacity !== undefined) values.opacity = material.opacity
      if (typeof material.roughness === 'number') values.roughness = material.roughness
      if (typeof material.metalness === 'number') values.metalness = material.metalness
      if (material.emissive?.isColor) values.emissive = colorHex(material.emissive)
      if (typeof material.emissiveIntensity === 'number') values.emissiveIntensity = material.emissiveIntensity
      if ('map' in material) values.texture = { enabled: Boolean(material.map), map: material.map?.name || null, mix: 'requires custom shader' }
      materials[key] = values

      const shaderState = shaderStates.current.get(material)
      const extensions = {}
      for (const control of getExtensionControls(entry)) {
        extensions[control.extensionId] ||= {}
        extensions[control.extensionId][control.id] = extensionValues[control.stateKey] ?? control.getValue?.() ?? control.value
      }
      if (shaderState || Object.keys(extensions).length) {
        shader[key] = {}
        if (shaderState) shader[key].finalColor = { ...shaderState.values }
        if (Object.keys(extensions).length) shader[key].extensions = extensions
      }
    }
    return {
      pageId,
      coordinateSpace: 'model-local',
      transforms: transformConfig.current,
      model: models.find(model => model.id === modelId)?.name || models.map(model => model.name),
      materials,
      batch: { scope: selectionScope, ...batchValues },
      shader,
    }
  }

  async function copyConfiguration(kind) {
    const configuration = createConfiguration()
    const text = kind === 'json'
      ? JSON.stringify(configuration, null, 2)
      : formatValues(configuration)
    setOutput(text)
    try { await navigator.clipboard.writeText(text) } catch { /* Output remains available for manual copying. */ }
  }

  function beginDrag(event) {
    if (event.target.closest('button')) return
    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function movePanel(event) {
    if (!dragRef.current) return
    const left = Math.max(0, Math.min(window.innerWidth - 120, event.clientX - dragRef.current.offsetX))
    const top = Math.max(0, Math.min(window.innerHeight - 48, event.clientY - dragRef.current.offsetY))
    setPosition({ left, top })
  }

  const panelStyle = position ? { left: position.left, top: position.top, right: 'auto' } : undefined
  const shaderState = selectedShaderState

  return (
    <>
      <ModelTransformEditor key={selectedModel?.id} model={selectedModel} pageId={pageId} open={open} panelRef={panelRef} onPick={mesh => setMeshUuid(mesh.uuid)} onConfig={value => { transformConfig.current = value }} />
      {open && createPortal(<aside ref={panelRef} className="model-editor-panel" style={panelStyle}>
        <header className="model-editor-header" onPointerDown={beginDrag} onPointerMove={movePanel} onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }}>
          <div><strong>3D Model Material Editor</strong><small>Development tool</small></div>
          <div className="model-editor-header-actions">
            <button type="button" title={collapsed ? 'Expand panel' : 'Collapse panel'} aria-label={collapsed ? 'Expand panel' : 'Collapse panel'} onClick={() => setCollapsed(value => !value)}>{collapsed ? '▢' : '−'}</button>
            <button type="button" title="Close editor" aria-label="Close editor" onClick={closeDevEditor}>×</button>
          </div>
        </header>
        {!collapsed && <div className="model-editor-content">
          <section className="model-editor-section model-editor-selection">
            <label>Model<select value={modelId} onChange={event => { setModelId(event.target.value); setMeshUuid(''); setMaterialIndex(0) }}>{models.map(model => <option key={model.id} value={model.id}>{model.name || model.id}</option>)}</select></label>
            <label>Mesh<select value={meshUuid} onChange={event => { setMeshUuid(event.target.value); setMaterialIndex(0) }}>{meshes.map(mesh => <option key={mesh.uuid} value={mesh.uuid}>{mesh.name || 'Unnamed Mesh'} ({meshEntries.filter(entry => entry.mesh === mesh).length} material{meshEntries.filter(entry => entry.mesh === mesh).length === 1 ? '' : 's'})</option>)}</select></label>
            <label>Material<select value={selectedEntry?.materialIndex ?? 0} onChange={event => setMaterialIndex(Number(event.target.value))}>{materialEntries.map(entry => <option key={entry.materialIndex} value={entry.materialIndex}>{materialName(entry.material, entry.materialIndex)} · {entry.material.type}{'map' in entry.material && entry.material.map ? ' · texture' : ' · no map'}</option>)}</select></label>
            <label>Selection Scope<select value={selectionScope} onChange={event => setSelectionScope(event.target.value)}>
              <option value="allMaterials">All Materials</option>
              <option value="currentMesh">Current Mesh</option>
              <option value="currentMaterial">Current Material</option>
            </select></label>
            {selectedEntry && <div className="model-editor-material-meta">
              <span>Mesh: {selectedEntry.mesh.name || 'Unnamed Mesh'}</span>
              <span>Material: {selectedEntry.material.type}</span>
              <span>Map / texture: {selectedEntry.material.map ? selectedEntry.material.map.name || 'yes' : 'no'}</span>
            </div>}
          </section>

          <div className="model-editor-transform-host" />
          {selectedMaterial && <>
            <section className="model-editor-section">
              <h3>Batch Adjustments · {batchTargets.length} target{batchTargets.length === 1 ? '' : 's'}</h3>
              <small className="model-editor-note">{selectedModel?.batchColorMode === 'finalColor' ? 'Color multipliers transform the final rendered color; texture assets remain unchanged.' : "Color multipliers are relative to each material's initial color. Texture is never batch-edited."}</small>
              <RangeControl label="Hue Shift" value={batchValues.hueShift} min={-180} max={180} step={1} suffix="°" onChange={value => updateBatchValue('hueShift', value)} />
              <RangeControl label="Saturation Multiplier" value={batchValues.saturation} min={0} max={2} step={0.01} onChange={value => updateBatchValue('saturation', value)} />
              <RangeControl label="Brightness Multiplier" value={batchValues.brightness} min={0} max={2} step={0.01} onChange={value => updateBatchValue('brightness', value)} />
              <RangeControl label="Opacity Multiplier" value={batchValues.opacity} min={0} max={2} step={0.01} onChange={value => updateBatchValue('opacity', value)} />
              <div className="model-editor-batch-absolute">
                <RangeControl label="Roughness" value={batchValues.roughness} min={0} max={1} step={0.01} disabled={!batchTargets.some(entry => typeof entry.material.roughness === 'number')} onChange={value => updateBatchValue('roughness', value)} />
                <label className="model-editor-toggle"><input type="checkbox" checked={batchValues.roughnessApply} disabled={!batchTargets.some(entry => typeof entry.material.roughness === 'number')} onChange={event => updateBatchValue('roughnessApply', event.target.checked)} /> Apply</label>
              </div>
              <div className="model-editor-batch-absolute">
                <RangeControl label="Metalness" value={batchValues.metalness} min={0} max={1} step={0.01} disabled={!batchTargets.some(entry => typeof entry.material.metalness === 'number')} onChange={value => updateBatchValue('metalness', value)} />
                <label className="model-editor-toggle"><input type="checkbox" checked={batchValues.metalnessApply} disabled={!batchTargets.some(entry => typeof entry.material.metalness === 'number')} onChange={event => updateBatchValue('metalnessApply', event.target.checked)} /> Apply</label>
              </div>
              <RangeControl label="Emissive Intensity Multiplier" value={batchValues.emissiveIntensity} min={0} max={5} step={0.01} onChange={value => updateBatchValue('emissiveIntensity', value)} />
            </section>

            <section className="model-editor-section">
              <h3>Color</h3>
              {selectedMaterial.color?.isColor && <>
                <ColorControl label="Base Color" value={selectedColorHex} onChange={updateMaterialColor} />
                <RangeControl label="Hue" value={selectedHsv.h} min={0} max={360} step={1} suffix="°" onChange={value => updateColorHsv({ h: value })} />
                <RangeControl label="Saturation" value={selectedHsv.s} min={0} max={1} step={0.01} onChange={value => updateColorHsv({ s: value })} />
                <RangeControl label="Brightness / Value" value={selectedHsv.v} min={0} max={1} step={0.01} onChange={value => updateColorHsv({ v: value })} />
              </>}
            </section>

            <section className="model-editor-section">
              <h3>Material</h3>
              {typeof selectedMaterial.opacity === 'number' && <RangeControl label="Opacity" value={selectedMaterial.opacity} min={0} max={1} step={0.01} onChange={value => updateMaterialNumber('opacity', value)} />}
              {typeof selectedMaterial.roughness === 'number' && <RangeControl label="Roughness" value={selectedMaterial.roughness} min={0} max={1} step={0.01} onChange={value => updateMaterialNumber('roughness', value)} />}
              {typeof selectedMaterial.metalness === 'number' && <RangeControl label="Metalness" value={selectedMaterial.metalness} min={0} max={1} step={0.01} onChange={value => updateMaterialNumber('metalness', value)} />}
              {selectedMaterial.emissive?.isColor && <ColorControl label="Emissive" value={colorHex(selectedMaterial.emissive)} onChange={value => { selectedMaterial.emissive.set(value); refresh() }} />}
              {typeof selectedMaterial.emissiveIntensity === 'number' && <RangeControl label="Emissive Intensity" value={selectedMaterial.emissiveIntensity} min={0} max={10} step={0.01} onChange={value => updateMaterialNumber('emissiveIntensity', value)} />}
            </section>

            <section className="model-editor-section">
              <h3>Texture</h3>
              {hasMapProperty ? <>
                <label className="model-editor-toggle"><input type="checkbox" checked={Boolean(selectedMaterial.map)} disabled={!initialMap} onChange={event => updateTexture(event.target.checked)} /> Texture On / Off</label>
                <RangeControl label="Texture Intensity / Mix" value={1} min={0} max={1} step={0.01} disabled suffix="custom shader" onChange={() => {}} />
                <small className="model-editor-note">Native material map mixing requires a custom shader; the existing material is left intact.</small>
              </> : <small className="model-editor-note">This material has no map property.</small>}
            </section>

            {shaderState && selectedModel?.batchColorMode !== 'finalColor' && <section className="model-editor-section">
              <h3>Shader Color Controls</h3>
              {!shaderState.supportsFinalColor && <small className="model-editor-note">This custom shader does not expose Three.js opaque_fragment; generic final-color controls may not apply.</small>}
              <RangeControl label="Final Hue Shift" value={shaderState.values.finalHueShift} min={-180} max={180} step={1} suffix="°" onChange={value => { setFinalColorValue(shaderState, 'finalHueShift', value); refresh() }} />
              <RangeControl label="Final Saturation" value={shaderState.values.finalSaturation} min={0} max={2} step={0.01} onChange={value => { setFinalColorValue(shaderState, 'finalSaturation', value); refresh() }} />
              <RangeControl label="Final Brightness" value={shaderState.values.finalBrightness} min={0} max={2} step={0.01} onChange={value => { setFinalColorValue(shaderState, 'finalBrightness', value); refresh() }} />
              <ColorControl label="Color Tint" value={shaderState.values.finalTint} onChange={value => { setFinalColorValue(shaderState, 'finalTint', value); refresh() }} />
              <RangeControl label="Tint Mix" value={shaderState.values.finalTintMix} min={0} max={1} step={0.01} onChange={value => { setFinalColorValue(shaderState, 'finalTintMix', value); refresh() }} />
            </section>}

            {selectedExtensions.length > 0 && <section className="model-editor-section">
              <h3>{selectedExtensions[0].extensionLabel}</h3>
              {selectedExtensions.map(control => <RangeControl
                key={control.stateKey}
                label={control.label}
                value={extensionValues[control.stateKey] ?? control.getValue?.() ?? control.value}
                min={control.min}
                max={control.max}
                step={control.step ?? 0.01}
                suffix={control.suffix || ''}
                onChange={value => updateExtension(control, value)}
              />)}
            </section>}

            <div className="model-editor-actions">
              <button type="button" onClick={resetCurrent}>Reset Current</button>
              <button type="button" onClick={resetAll}>Reset All</button>
            </div>
            <div className="model-editor-actions">
              <button type="button" onClick={() => copyConfiguration('values')}>Copy Values</button>
              <button type="button" onClick={() => copyConfiguration('json')}>Copy JSON</button>
            </div>
            {output && <textarea className="model-editor-output" aria-label="Copied editor values" readOnly value={output} onFocus={event => event.target.select()} />}
          </>}
        </div>}
      </aside>, document.body)}
    </>
  )
}

function formatValues(configuration) {
  const lines = [`Page: ${configuration.pageId}`, `Coordinates: ${configuration.coordinateSpace}`, 'Transforms:', JSON.stringify(configuration.transforms, null, 2), `Model: ${Array.isArray(configuration.model) ? configuration.model.join(', ') : configuration.model}`, '', 'Materials:']
  for (const [key, value] of Object.entries(configuration.materials)) {
    lines.push(`- ${key}`)
    for (const [property, setting] of Object.entries(value)) {
      if (property !== 'mesh' && property !== 'material') lines.push(`  ${property}: ${JSON.stringify(setting)}`)
    }
  }
  lines.push('', 'Batch:', JSON.stringify(configuration.batch, null, 2), '', 'Shader / extensions:', JSON.stringify(configuration.shader, null, 2))
  return lines.join('\n')
}

export default import.meta.env.DEV ? ModelMaterialEditor : () => null
