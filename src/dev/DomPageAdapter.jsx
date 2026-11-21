import { useEffect, useRef, useState } from 'react'
import LayoutEditor from './LayoutEditor'
import { COMPONENT_LAYOUT_SELECTOR, LAYOUT_FIELDS, layoutItem, layoutOverrides, layoutStyles, localSize } from './domLayout'
import { buildTextStyle, enablePageTextPersistence, registerText, unregisterText, useTextEditorState, getTextEntry } from './textEditorStore'
import { PAGE_EDITOR_SCOPES, PAGE_LAYOUT_TARGETS, TEXT_CANDIDATES, EDITOR_UI } from './pageEditorRegistry'
import { GLOBE_LAYOUT_DEFAULTS, GLOBE_LAYOUT_REVISION } from '../components/globeTest/config'

const hash = text => { let n = 2166136261; for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return (n >>> 0).toString(36) }
const GLOBE_LAYOUT_DEFAULTS_BY_ID = new Map(GLOBE_LAYOUT_DEFAULTS.map(item => [item.id, item]))
const normalizeSelector = selector => selector.replace(/:nth-of-type\(\d+\)/g, '')
const GLOBE_LAYOUT_DEFAULTS_BY_SELECTOR = (() => {
  const grouped = new Map()
  for (const item of GLOBE_LAYOUT_DEFAULTS) {
    const key = normalizeSelector(item.selector)
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }
  return new Map([...grouped].filter(([, items]) => items.length === 1).map(([key, items]) => [key, items[0]]))
})()
function selectorFor(element, root) {
  const path = []
  for (let node = element; node; node = node.parentElement) {
    if (node.id) { path.unshift(`#${CSS.escape(node.id)}`); break }
    if (node.hasAttribute('data-dev-scope')) { path.unshift(`[data-dev-scope="${CSS.escape(node.dataset.devScope)}"]`); break }
    const tag = node.localName
    const siblings = node.parentElement ? [...node.parentElement.children].filter(n => n.localName === tag) : [node]
    const cls = [...node.classList].find(c => !c.startsWith('is-') && !c.startsWith('has-'))
    path.unshift(`${tag}${cls ? `.${CSS.escape(cls)}` : ''}:nth-of-type(${siblings.indexOf(node) + 1})`)
    if (node === root) break
  }
  return path.join(' > ')
}
const directNodes = element => [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE)
const readOwnText = element => [...element.childNodes].map(n => n.nodeType === Node.TEXT_NODE ? n.textContent : n.nodeName === 'BR' && n.style.display !== 'none' ? '\n' : '').join('')

// Apply published layout defaults and local editor patches to the current DOM.
export default function DomPageAdapter({ pageId, storage = globalThis.localStorage }) {
  const { data } = useTextEditorState()
  const textRecords = useRef(new Map())
  const elements = useRef(new Map())
  const originals = useRef(new Map())
  const [items, setItems] = useState([])
  const patches = useRef({})
  const draftReadable = useRef(true)
  const layoutKey = `layout-editor:codex-${pageId}:dom-v1`
  const layoutRevisionKey = `${layoutKey}:defaults-revision`
  const textPrefix = `codex-${pageId}-dom-`

  useEffect(() => {
    const scope = PAGE_EDITOR_SCOPES[pageId] || '.portal-placeholder-page'
    if (!scope) return
    try {
      const saved = JSON.parse(storage.getItem(layoutKey) || '[]')
      if (!Array.isArray(saved) || saved.some(item => !item || typeof item.id !== 'string')) throw new Error('Unknown draft format')
      const currentDefaults = pageId !== 'globe-test' || storage.getItem(layoutRevisionKey) === GLOBE_LAYOUT_REVISION
      patches.current = Object.fromEntries((currentDefaults ? saved : []).map(item => [item.id, item]))
    } catch (error) { draftReadable.current = false; console.warn(`[LayoutEditor] Preserving unreadable draft ${layoutKey}`, error) }
    const stopPersistence = enablePageTextPersistence(`codex-${pageId}`, textPrefix, { readOnly: false })
    let scheduled = 0
    const resized = new ResizeObserver(() => schedule())
    function scan() {
      scheduled = 0
      const seenText = new Set(), seenLayout = new Set(), nextItems = []
      for (const root of document.querySelectorAll(scope)) {
        for (const element of root.querySelectorAll(TEXT_CANDIDATES)) {
          const registeredAncestor = element.closest('[data-text-editor-id]')
          if (element.closest(COMPONENT_LAYOUT_SELECTOR) || element.closest(EDITOR_UI) || element.closest('[data-dev-text-dynamic]') || registeredAncestor && !registeredAncestor.hasAttribute('data-dom-text-adapter')) continue
          const text = readOwnText(element)
          let record = textRecords.current.get(element)
          // Clearing editor text does not unmount its node. Dropping the record
          // restores the source and starts a clear/restore MutationObserver loop.
          if ((!text.trim() && !record) || element.closest('.wp-world-readings b, .wp-live') || element.matches('.tt-compass > span') || (element.closest('.edition-live-coordinate') && element.localName !== 'i')) continue
          const selector = selectorFor(element, root)
          // Dynamic dialogue gets a separate ID for each source string. Never apply
          // one line's text draft to another line sharing the same React element.
          if (record && text !== record.appliedText && text !== record.sourceText) {
            unregisterText(record.id); restoreStyles(record); record.breaks.forEach(({node, display}) => { node.style.display = display }); textRecords.current.delete(element); record = null
          }
          if (!record) {
            const id = `${textPrefix}${element.localName}-${hash(`${selector}|${text}`)}`
            record = { id, element, sourceText: text, appliedText: text, nodes: directNodes(element).map(node => ({ node, text: node.textContent })), styles: new Map(), breaks: [...element.querySelectorAll(':scope > br')].map(node => ({node, display: node.style.display})) }
            textRecords.current.set(element, record)
            element.dataset.domTextAdapter = ''
            element.dataset.textEditorId = id
            registerText(id, `${pageId} · ${element.localName} · ${text.trim().slice(0, 36)}`, element, 'registered', { pageId, selector, coordinateSpace: 'dom-local-px', defaultValues: { text } })
          }
          const entry = getTextEntry(record.id)
          if (entry) applyTextRecord(record, entry)
          seenText.add(element)
        }
        const targets = PAGE_LAYOUT_TARGETS[pageId] ? `${PAGE_LAYOUT_TARGETS[pageId]}, img, svg` : ['comic','t-comic'].includes(pageId) ? null : 'img, svg'
        if (!targets) continue
        for (const element of root.querySelectorAll(targets)) {
          if (element.closest(COMPONENT_LAYOUT_SELECTOR) || element.closest(EDITOR_UI) || element.matches('canvas') || element.closest('.layout-editor-item')) continue
          const selector = selectorFor(element, root)
          const id = `${pageId}-${element.dataset.devLayout || element.dataset.devScope || element.dataset.character || element.localName}-${hash(selector)}`
          seenLayout.add(id); elements.current.set(id, element)
          const supplied = pageId === 'globe-test'
            ? GLOBE_LAYOUT_DEFAULTS_BY_ID.get(id) ?? GLOBE_LAYOUT_DEFAULTS_BY_SELECTOR.get(normalizeSelector(selector))
            : null
          let original = originals.current.get(id)
          if (!original || original.element !== element) {
            const defaults = { id, selector, label: `${[...element.classList].find(c => !c.startsWith('is-') && !c.startsWith('has-')) || element.localName} · ${id}`, x: 0, y: 0, width: localSize(element, 'width'), height: localSize(element, 'height'), rotation: 0, zIndex: parseInt(getComputedStyle(element).zIndex) || 0, isNode: true, coordinateSpace: 'local-css-px-offset' }
            original = { element, styles: new Map(), defaults }
            originals.current.set(id, original)
            resized.observe(element)
          }
          const saved = patches.current[id] || {}
          const overrides = { ...layoutOverrides(supplied), ...layoutOverrides(saved) }
          for (const field of ['width','height']) if (!(field in overrides)) original.defaults[field] = localSize(element, field)
          nextItems.push(layoutItem(original.defaults, supplied, saved))
        }
      }
      for (const [element, record] of textRecords.current) if (!seenText.has(element)) {
        unregisterText(record.id); restoreText(record); textRecords.current.delete(element)
      }
      for (const [id, original] of originals.current) if (!seenLayout.has(id)) {
        resized.unobserve(original.element); restoreStyles(original); originals.current.delete(id); elements.current.delete(id)
      }
      setItems(previous => JSON.stringify(previous) === JSON.stringify(nextItems) ? previous : nextItems)
    }
    function schedule() { if (!scheduled) scheduled = requestAnimationFrame(scan) }
    scan()
    // Child/character changes include lazy mounts and dynamically opened panels.
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class','hidden','inert','aria-hidden','data-layout-owned'] })
    document.addEventListener('load', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      observer.disconnect(); resized.disconnect(); document.removeEventListener('load', schedule, true); window.removeEventListener('resize', schedule); cancelAnimationFrame(scheduled); stopPersistence()
      for (const record of textRecords.current.values()) { unregisterText(record.id); restoreText(record) }
      for (const original of originals.current.values()) restoreStyles(original)
      textRecords.current.clear(); originals.current.clear(); elements.current.clear()
    }
  }, [pageId, layoutKey, textPrefix, storage])

  useEffect(() => {
    for (const record of textRecords.current.values()) {
      const entry = data[record.id]
      if (!entry) continue
      applyTextRecord(record, entry)
    }
  }, [data])

  useEffect(() => {
    for (const item of items) {
      const original = originals.current.get(item.id)
      if (!original) continue
      applyStyles(original, layoutStyles(item))
    }
  }, [items])

  function changeItems(next) {
    // Merge retained/offscreen elements and preserve unknown saved fields.
    for (const item of next) {
      const defaults = originals.current.get(item.id)?.defaults
      const patch = { ...patches.current[item.id], id: item.id, selector: item.selector }
      for (const field of LAYOUT_FIELDS) {
        if (item[field] !== defaults?.[field]) patch[field] = item[field]
        else delete patch[field]
      }
      patch.changedFields = LAYOUT_FIELDS.filter(field => Number.isFinite(patch[field]))
      patches.current[item.id] = patch
    }
    setItems(next.map(item => {
      const original = originals.current.get(item.id)
      const supplied = pageId === 'globe-test'
        ? GLOBE_LAYOUT_DEFAULTS_BY_ID.get(item.id) ?? GLOBE_LAYOUT_DEFAULTS_BY_SELECTOR.get(normalizeSelector(item.selector))
        : null
      return original ? layoutItem(original.defaults, supplied, patches.current[item.id]) : item
    }))
    try {
      if (!draftReadable.current) throw new Error('Unreadable draft is preserved; changes remain available in Copy Config')
      storage.setItem(layoutKey, JSON.stringify(Object.values(patches.current)))
      if (pageId === 'globe-test') storage.setItem(layoutRevisionKey, GLOBE_LAYOUT_REVISION)
    }
    catch (error) { console.warn(`[LayoutEditor] Cannot save ${layoutKey}`, error) }
  }
  return items.length ? <LayoutEditor externalElements={elements} items={items} initialItems={[...originals.current.values()].map(record => record.defaults)} onChange={changeItems} pageId={pageId} layoutId={`codex-${pageId}:dom-v1`} /> : null
}
function restoreStyles(record) {
  for (const [key, value] of record.styles) record.element.style[key] = value
  record.styles.clear()
}
function applyStyles(record, styles) {
  for (const [key, value] of record.styles) if (!(key in styles)) { record.element.style[key] = value; record.styles.delete(key) }
  for (const [key, value] of Object.entries(styles)) {
    if (!record.styles.has(key)) record.styles.set(key, record.element.style[key])
    if (record.element.style[key] !== String(value)) record.element.style[key] = value
  }
}
function applyTextRecord(record, entry) {
  applyStyles(record, buildTextStyle(entry))
  const changed = entry.values.text !== entry.defaults.text
  record.appliedText = changed ? entry.values.text : record.sourceText
  record.nodes.forEach(({ node, text }, index) => {
    const value = changed ? index === 0 ? record.appliedText : '' : text
    if (node.textContent !== value) node.textContent = value
  })
  record.breaks.forEach(({node, display}) => { node.style.display = changed ? 'none' : display })
}
function restoreText(record) {
  restoreStyles(record)
  record.nodes.forEach(({ node, text }) => { if (node.parentElement === record.element && record.appliedText !== record.sourceText) node.textContent = text })
  record.breaks.forEach(({node, display}) => { node.style.display = display })
  delete record.element.dataset.domTextAdapter; delete record.element.dataset.textEditorId
}
