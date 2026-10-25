import { useSyncExternalStore } from 'react'

// DEV-only registry of explicitly registered editable text elements; values survive page/mode switches.
let state = { mounted: [], selectedId: null, data: {} }
const elements = new Map()
const listeners = new Set()
let editVersion = 0
const edits = new Map()
const markEdited = ids => { editVersion += 1; ids.forEach(id => edits.set(id, { version: editVersion, entry: state.data[id] })) }

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
export const getTextEntry = id => state.data[id]
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

const inferPageId = id => id.startsWith('t-dialog-') ? 't-comic' : ['big-test','globe-test','telescope-test','natural-test','human-test','ball-test','t-comic','intro','home'].find(page => id.startsWith(`${page}-`)) || (id.startsWith('main-') || id.startsWith('home-') ? 'home' : id.startsWith('story') ? 'comic' : undefined)

export function registerText(id, label, element, type = 'registered', options = {}) {
  if (!element) return
  elements.set(id, element)
  const existing = state.data[id]
  const defaults = { ...captureDefaults(element), ...existing?.defaults, ...options.defaultValues }
  const sourceDefaultKeys = [...new Set([...(existing?.sourceDefaultKeys ?? []), ...Object.keys(options.defaultValues ?? {})])]
  setState({
    mounted: state.mounted.includes(id) ? state.mounted : [...state.mounted, id],
    selectedId: state.selectedId ?? id,
    data: { ...state.data, [id]: { ...existing, type: existing?.type ?? type, label, selector: options.selector ?? existing?.selector, pageId: options.pageId ?? existing?.pageId ?? inferPageId(id), coordinateSpace: existing?.coordinateSpace ?? options.coordinateSpace, sourceDefaultKeys, defaults, values: existing?.values ?? { ...defaults } } },
  })
}

export function unregisterText(id) {
  elements.delete(id)
  const mounted = state.mounted.filter(mountedId => mountedId !== id)
  // StrictMode briefly unregisters new draft nodes; preserve the selection
  // until they remount. TextEditor already falls back for an absent element.
  setState({ ...state, mounted, selectedId: state.selectedId })
}

export const selectText = id => setState({ ...state, selectedId: id })

export function updateText(id, patch) {
  const entry = state.data[id]
  if (!entry) return
  markEdited([id])
  setState({ ...state, data: { ...state.data, [id]: { ...entry, values: { ...entry.values, ...patch } } } })
}

export function resetTexts(ids) {
  markEdited(ids)
  const data = { ...state.data }
  ids.forEach(id => { if (data[id]) data[id] = { ...data[id], values: { ...data[id].defaults } } })
  setState({ ...state, data })
}

export const getMountedTextIds = () => state.mounted
export const getTextValues = id => state.data[id]?.values

// Page-scoped persistence. Production defaults to restoring without storage writes.
export function enablePageTextPersistence(pageId, prefix, { readOnly = !import.meta.env.DEV } = {}) {
  const storageKey = `genesis:text-editor:${pageId}:v1`
  const prefixes = [prefix, ...(pageId === 'home' ? ['home-','main-'] : pageId === 't-comic' ? ['t-dialog-'] : [])]
  const belongs = (id, entry) => prefixes.some(value => id.startsWith(value)) || (entry?.type === 'draft' && entry.pageId === pageId)
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
    const data = { ...state.data }
    Object.entries(saved).forEach(([id, entry]) => {
      if (!entry || !belongs(id, entry) || !entry.values || !entry.defaults) return
      // Legacy IDs were global counters. Namespace them in memory so opening
      // another page cannot replace a draft with the same historical ID.
      const runtimeId = entry.type === 'draft' && /^draft-text-\d+$/.test(id) ? `draft-text-${pageId}-legacy-${id.slice(11)}` : id
      const restored = runtimeId === id ? entry : { ...entry, originalId: id }
      data[runtimeId] = data[runtimeId] ? { ...data[runtimeId], values: { ...data[runtimeId].defaults, ...entry.values } } : restored
      if (entry.type === 'draft') draftCounter = Math.max(draftCounter, Number(id.match(/(\d+)$/)?.[1]) || 0)
    })
    setState({ ...state, data })
  } catch (error) { console.warn(`[TextEditor] Could not restore ${pageId}`, error) }
  if (readOnly) return () => {}
  let lastSavedVersion = editVersion
  const save = () => {
    const changed = [...edits].some(([id, edit]) => edit.version > lastSavedVersion && belongs(id, edit.entry))
    if (!changed) return
    lastSavedVersion = editVersion
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Unknown draft format')
      const current = Object.fromEntries(Object.entries(state.data).filter(([id, entry]) => belongs(id, entry)).map(([id, entry]) => [entry.originalId || id, entry]))
      for (const [id, entry] of Object.entries(saved)) if (entry?.type === 'draft' && belongs(id, entry) && !state.data[id]) delete saved[id]
      localStorage.setItem(storageKey, JSON.stringify({ ...saved, ...current }))
    }
    catch (error) { console.warn(`[TextEditor] Could not save ${pageId}`, error) }
  }
  // Write only after a store change; mounting a page never replaces its saved draft.
  return subscribe(save)
}

export const textBelongsToPage = (id, pageId) => {
  const entry = state.data[id]
  if (entry?.pageId) return entry.pageId === pageId
  if (entry?.type === 'draft') return false
  return id.startsWith(`${pageId}-`) || (pageId === 'home' && id.startsWith('main-')) || (pageId === 'comic' && id.startsWith('story'))
}
export const getPageTextIds = pageId => state.mounted.filter(id => textBelongsToPage(id, pageId))

export const getTextConfig = pageId => ({
  pageId,
  draftOrigin: 'draft x/y are px offsets of the element top-left from the viewport center (left: 50%, top: 50%)',
  registered: Object.fromEntries(getPageTextIds(pageId).filter(id => state.data[id].type === 'registered').map(id => {
    const entry = state.data[id]
    return [id, { ...entry.values, ...(entry.coordinateSpace ? { coordinateSpace: entry.coordinateSpace } : {}), ...(entry.selector ? { selector: entry.selector } : {}) }]
  })),
  draft: Object.entries(state.data)
    .filter(([, entry]) => entry.type === 'draft' && entry.pageId === pageId)
    .map(([id, entry]) => ({ id, ...(entry.originalId ? { originalId: entry.originalId } : {}), ...entry.values })),
})

let draftCounter = 0

// Draft texts live only in this store; x/y are offsets from the viewport center.
export function addDraft(pageId, source) {
  draftCounter += 1
  const id = `draft-text-${pageId}-${draftCounter}`
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
  markEdited([id])
  edits.set(id, {version: editVersion, entry: {type: 'draft', pageId}})
  setState({
    ...state,
    selectedId: id,
    data: { ...state.data, [id]: { type: 'draft', pageId, label: `Draft ${draftCounter}`, defaults: { ...values }, values: { ...values } } },
  })
}

export function deleteDraft(id) {
  if (state.data[id]?.type !== 'draft') return
  markEdited([id])
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
