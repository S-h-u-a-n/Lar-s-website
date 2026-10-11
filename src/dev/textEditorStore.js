import { useSyncExternalStore } from 'react'

// DEV-only registry of explicitly registered editable text elements; values survive page/mode switches.
let state = { mounted: [], selectedId: null, data: {} }
const elements = new Map()
const listeners = new Set()

const setState = next => {
  state = next
  listeners.forEach(listener => listener())
}
const subscribe = listener => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const getState = () => state

export const useTextEditorState = () => useSyncExternalStore(subscribe, getState)
export const getTextElement = id => elements.get(id)
export const getTextCoordinateSpace = id => state.data[id]?.coordinateSpace

const toHex = rgb => {
  const channels = rgb.match(/[\d.]+/g)
  if (!channels || channels.length < 3) return '#000000'
  return `#${channels.slice(0, 3).map(value => Math.round(Number(value)).toString(16).padStart(2, '0')).join('')}`
}

const readText = element => Array.from(element.childNodes).map(node => (node.nodeName === 'BR' ? '\n' : node.textContent)).join('')

function captureDefaults(element) {
  const computed = getComputedStyle(element)
  const fontSize = parseFloat(computed.fontSize) || 16
  const textAlign = { start: 'left', end: 'right' }[computed.textAlign] || computed.textAlign
  const readPixelLength = value => {
    if (!value || value === 'auto' || !value.endsWith('px')) return null
    const length = Number.parseFloat(value)
    return Number.isFinite(length) ? length : null
  }
  return {
    text: readText(element),
    x: 0,
    y: 0,
    width: readPixelLength(element.style.width),
    maxWidth: readPixelLength(element.style.maxWidth),
    height: readPixelLength(element.style.height),
    maxHeight: readPixelLength(element.style.maxHeight),
    fontSize,
    fontFamily: computed.fontFamily,
    fontWeight: parseInt(computed.fontWeight, 10) || 400,
    lineHeight: computed.lineHeight === 'normal' ? 1.2 : Math.round((parseFloat(computed.lineHeight) / fontSize) * 1000) / 1000,
    letterSpacing: computed.letterSpacing === 'normal' ? 0 : parseFloat(computed.letterSpacing) || 0,
    textAlign,
    writingMode: computed.writingMode || 'horizontal-tb',
    rotation: 0,
    zIndex: Number.parseInt(computed.zIndex, 10) || 1,
    opacity: parseFloat(computed.opacity),
    color: toHex(computed.color),
  }
}

export function registerText(id, label, element, type = 'registered', options = {}) {
  if (!element) return
  elements.set(id, element)
  const existing = state.data[id]
  const defaults = { ...captureDefaults(element), ...existing?.defaults, ...options.defaultValues }
  const sourceDefaultKeys = [...new Set([...(existing?.sourceDefaultKeys ?? []), ...Object.keys(options.defaultValues ?? {})])]
  setState({
    mounted: state.mounted.includes(id) ? state.mounted : [...state.mounted, id],
    selectedId: state.selectedId ?? id,
    data: { ...state.data, [id]: { ...existing, type: existing?.type ?? type, label, coordinateSpace: existing?.coordinateSpace ?? options.coordinateSpace, sourceDefaultKeys, defaults, values: existing?.values ?? { ...defaults } } },
  })
}

export function unregisterText(id) {
  elements.delete(id)
  const mounted = state.mounted.filter(mountedId => mountedId !== id)
  setState({ ...state, mounted, selectedId: state.selectedId === id ? mounted[0] ?? null : state.selectedId })
}

export const selectText = id => setState({ ...state, selectedId: id })

export function updateText(id, patch) {
  const entry = state.data[id]
  if (!entry) return
  setState({ ...state, data: { ...state.data, [id]: { ...entry, values: { ...entry.values, ...patch } } } })
}

export function resetTexts(ids) {
  const data = { ...state.data }
  ids.forEach(id => { if (data[id]) data[id] = { ...data[id], values: { ...data[id].defaults } } })
  setState({ ...state, data })
}

export const getMountedTextIds = () => state.mounted
export const getTextValues = id => state.data[id]?.values

// Page-scoped persistence. Production defaults to restoring without storage writes.
export function enablePageTextPersistence(pageId, prefix, { readOnly = true } = {}) {
  const storageKey = `genesis:text-editor:${pageId}:v1`
  const belongs = (id, entry) => id.startsWith(prefix) || (entry.type === 'draft' && entry.pageId === pageId)
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
    const data = { ...state.data }
    Object.entries(saved).forEach(([id, entry]) => {
      if (!entry || !belongs(id, entry) || !entry.values || !entry.defaults) return
      data[id] = data[id] ? { ...data[id], values: { ...data[id].defaults, ...entry.values } } : entry
      if (entry.type === 'draft') draftCounter = Math.max(draftCounter, Number(id.replace('draft-text-', '')) || 0)
    })
    setState({ ...state, data })
  } catch (error) { console.warn(`[TextEditor] Could not restore ${pageId}`, error) }
  if (readOnly) return () => {}
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(Object.entries(state.data).filter(([id, entry]) => belongs(id, entry))))) }
    catch (error) { console.warn(`[TextEditor] Could not save ${pageId}`, error) }
  }
  save()
  return subscribe(save)
}

export const getTextConfig = pageId => ({
  pageId,
  draftOrigin: 'draft x/y are px offsets of the element top-left from the viewport center (left: 50%, top: 50%)',
  registered: Object.fromEntries(state.mounted.filter(id => state.data[id].type === 'registered').map(id => {
    const entry = state.data[id]
    return [id, entry.coordinateSpace ? { ...entry.values, coordinateSpace: entry.coordinateSpace } : entry.values]
  })),
  draft: Object.entries(state.data)
    .filter(([, entry]) => entry.type === 'draft' && entry.pageId === pageId)
    .map(([id, entry]) => ({ id, ...entry.values })),
})

let draftCounter = 0

// Draft texts live only in this store; x/y are offsets from the viewport center.
export function addDraft(pageId, source) {
  draftCounter += 1
  const id = `draft-text-${draftCounter}`
  const bodyStyle = getComputedStyle(document.body)
  const values = source ? { ...source, x: source.x + 20, y: source.y + 20 } : {
    text: 'New Text',
    x: 0,
    y: 0,
    width: null,
    maxWidth: null,
    height: null,
    maxHeight: null,
    fontSize: 32,
    fontFamily: bodyStyle.fontFamily,
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: 0,
    textAlign: 'left',
    writingMode: 'horizontal-tb',
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    color: toHex(bodyStyle.color),
  }
  setState({
    ...state,
    selectedId: id,
    data: { ...state.data, [id]: { type: 'draft', pageId, label: `Draft ${draftCounter}`, defaults: { ...values }, values: { ...values } } },
  })
}

export function deleteDraft(id) {
  if (state.data[id]?.type !== 'draft') return
  const data = { ...state.data }
  delete data[id]
  setState({ ...state, data, selectedId: state.selectedId === id ? null : state.selectedId })
}

// Registered text applies only values that differ from defaults; drafts have no original CSS, so every value is applied.
export function buildTextStyle(entry) {
  const { defaults: d, values: v } = entry
  const isDraft = entry.type === 'draft'
  const changed = key => isDraft || entry.sourceDefaultKeys?.includes(key) || v[key] !== d[key]
  const style = {}
  if (changed('x') || changed('y')) style.translate = `${v.x}px ${v.y}px`
  if (changed('rotation')) style.rotate = `${v.rotation}deg`
  if (changed('width')) style.width = v.width == null ? 'auto' : `${v.width}px`
  if (changed('maxWidth')) style.maxWidth = v.maxWidth == null ? 'none' : `${v.maxWidth}px`
  if (changed('height')) style.height = v.height == null ? 'auto' : `${v.height}px`
  if (changed('maxHeight')) style.maxHeight = v.maxHeight == null ? 'none' : `${v.maxHeight}px`
  if (changed('zIndex')) style.zIndex = v.zIndex
  if (changed('fontSize')) style.fontSize = `${v.fontSize}px`
  if (changed('fontFamily')) style.fontFamily = v.fontFamily
  if (changed('fontWeight')) style.fontWeight = v.fontWeight
  if (changed('lineHeight')) style.lineHeight = v.lineHeight
  if (changed('letterSpacing')) style.letterSpacing = `${v.letterSpacing}px`
  if (changed('textAlign')) style.textAlign = v.textAlign
  if (changed('writingMode')) style.writingMode = v.writingMode
  if (changed('opacity')) style.opacity = v.opacity
  if (changed('color')) style.color = v.color
  if (!isDraft && v.text !== d.text) style.whiteSpace = 'pre-line'
  return style
}
