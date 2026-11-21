import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import './LayoutEditor.css'
import { createPortal } from 'react-dom'
import { localDragDelta, isEditorTargetVisible } from './editorCoordinates'
import { useIsDevEditorActive, useRegisterDevEditor } from './devEditorStore'

const HANDLE_CORNERS = ['nw', 'ne', 'sw', 'se']
const ALWAYS_SELECTABLE = () => true
const IDENTITY_DRAFT_MIGRATION = savedItems => savedItems
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const notifyEditing = active => window.dispatchEvent(new CustomEvent('layout-editor-editing', { detail: { active } }))
const normalizeRotation = value => ((value + 180) % 360 + 360) % 360 - 180

function LayoutEditor({ pageId, externalElements, items, initialItems = items, onChange, onSelectionChange, referenceImage, referenceItemId, draftKey, layoutId = 'layout', hoverEnabled = false, defaultHoverOffsetX = 56, onItemActivate, interactiveWhenClosed = false, renderGroupContent, renderItemOverlay, stage, fitContent = true, scaleHeightWithWidth = false, renderNode, containerRef, stageBoundsRef, editorEnabled = true, canSelectItem = ALWAYS_SELECTABLE, migrateDraft = IDENTITY_DRAFT_MIGRATION }) {
  const editorId = useId()
  const draftDirty = useRef(false)
  const [, refreshBounds] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight)
  // With `stage`, x/width are % of stage.width and y is % of stage.height; the whole stage is uniformly scaled to fit and centered.
  const stageBoxRef = useRef(null)
  const [contentBounds, setContentBounds] = useState(null)
  const [stageBounds, setStageBounds] = useState(null)
  useEffect(() => {
    if (!stageBoundsRef?.current) return
    const update = () => {
      if (!stageBoundsRef.current) return
      const rect = stageBoundsRef.current.getBoundingClientRect()
      const padding = 24
      setStageBounds({ left: rect.left + padding, top: rect.top + padding, width: Math.max(1, rect.width - padding * 2), height: Math.max(1, rect.height - padding * 2) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(stageBoundsRef.current)
    window.addEventListener('resize', update)
    return () => { observer.disconnect(); window.removeEventListener('resize', update) }
  }, [stageBoundsRef])
  const fitBounds = stageBoundsRef && fitContent && contentBounds ? contentBounds : { x: 0, y: 0, width: stage?.width || 1, height: stage?.height || 1 }
  const stageScale = stage && stageBounds ? Math.min(stageBounds.width / fitBounds.width, stageBounds.height / fitBounds.height) : stage ? Math.min(viewportWidth / stage.width, viewportHeight / stage.height) : 1
  const unitW = stage ? stage.width : 0
  const unitH = stage ? stage.height : 0
  const containerRect = () => containerRef?.current?.getBoundingClientRect()
  const px = (value, size, viewportUnit) => stage ? `${value / 100 * size}px` : `${value}${viewportUnit}`
  const stageOffsetX = stage ? (stageBounds?.left || 0) + ((stageBounds?.width ?? viewportWidth) - fitBounds.width * stageScale) / 2 - fitBounds.x * stageScale : 0
  const stageOffsetY = stage ? (stageBounds?.top || 0) + ((stageBounds?.height ?? viewportHeight) - fitBounds.height * stageScale) / 2 - fitBounds.y * stageScale : 0

  // Fit the complete rendered content, including saved text offsets and rotated art,
  // rather than assuming every element remains inside the nominal design rectangle.
  useLayoutEffect(() => {
    const box = stageBoxRef.current
    if (!stageBoundsRef || !stage || !box || !fitContent) return
    const measure = () => {
      const base = box.getBoundingClientRect()
      const scale = base.width / stage.width
      if (!scale) return
      let left = 0, top = 0, right = stage.width, bottom = stage.height
      for (const element of box.querySelectorAll('.layout-editor-item, .t-comic-dialogue-text')) {
        const rect = element.getBoundingClientRect()
        left = Math.min(left, (rect.left - base.left) / scale)
        top = Math.min(top, (rect.top - base.top) / scale)
        right = Math.max(right, (rect.right - base.left) / scale)
        bottom = Math.max(bottom, (rect.bottom - base.top) / scale)
      }
      const next = { x: left, y: top, width: right - left, height: bottom - top }
      setContentBounds(previous => previous && Object.keys(next).every(key => Math.abs(previous[key] - next[key]) < 0.1) ? previous : next)
    }
    measure()
    const resize = new ResizeObserver(measure)
    box.querySelectorAll('.layout-editor-item, .t-comic-dialogue-text').forEach(element => resize.observe(element))
    const mutations = new MutationObserver(records => {
      if (records.some(record => record.target !== box)) measure()
    })
    mutations.observe(box, { subtree: true, attributes: true, childList: true, characterData: true })
    document.fonts?.ready.then(measure)
    return () => { resize.disconnect(); mutations.disconnect() }
  }, [stageBoundsRef, stage?.width, stage?.height, items, fitContent])
  const itemPosition = item => {
    if (externalElements) {
      const rect = externalElements.current.get(item.id)?.getBoundingClientRect()
      return { left: rect?.left || 0, top: rect?.top || 0, width: rect?.width || 0 }
    }
    if (containerRef) return { left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%` }
    if (!stage) return { left: `${item.x}vw`, top: `${item.y}vh`, width: `${item.width}vw` }
    if (item.coordinateSpace === 'viewport') return {
      left: `${(item.x / 100 * viewportWidth - stageOffsetX) / stageScale}px`,
      top: `${(item.y / 100 * viewportHeight - stageOffsetY) / stageScale}px`,
      width: `${item.width / 100 * viewportWidth / stageScale}px`,
    }
    return { left: px(item.x, unitW, 'vw'), top: px(item.y, unitH, 'vh'), width: px(item.width, unitW, 'vw') }
  }
  const itemHeight = item => {
    if (externalElements) return `${externalElements.current.get(item.id)?.getBoundingClientRect().height || 0}px`
    if (containerRef) {
      if (typeof item.height === 'number') return `${item.height}%`
      const width = item.width / 100 * (containerRect()?.width ?? 0)
      return `${width / item.ratio}px`
    }
    if (typeof item.height === 'number') return stage ? `${item.height / 100 * unitH}px` : `${item.height}vh`
    if (!stage) return `${item.width / item.ratio}vw`
    const width = item.coordinateSpace === 'viewport'
      ? item.width / 100 * viewportWidth / stageScale
      : item.width / 100 * stage.width
    return `${width / item.ratio}px`
  }
  useRegisterDevEditor('img', editorId, editorEnabled)
  const isOpen = useIsDevEditorActive(editorId)
  useEffect(() => {
    if (!externalElements || !isOpen) return
    let frame, last = 0
    const refresh = now => {
      if (now - last > 32) { last = now; refreshBounds(value => value + 1) }
      frame = requestAnimationFrame(refresh)
    }
    frame = requestAnimationFrame(refresh)
    return () => cancelAnimationFrame(frame)
  }, [externalElements, isOpen])
  const [selectedId, setSelectedId] = useState(items[0]?.id)
  const [referenceVisible, setReferenceVisible] = useState(Boolean(referenceImage || referenceItemId))
  const [referenceOpacity, setReferenceOpacity] = useState(0.3)
  const [copiedConfig, setCopiedConfig] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [debug, setDebug] = useState({ action: 'idle', x: 0, y: 0, captured: false })
  const [panelPosition, setPanelPosition] = useState(null)
  const interactionRef = useRef(null)
  const itemRefs = useRef({})
  const panelRef = useRef(null)
  const panelDragRef = useRef(null)
  const showEditor = import.meta.env.DEV && editorEnabled && isOpen
  const selectableItems = items.filter(canSelectItem)
    .filter(item => !item.editorOnly || showEditor)
    .filter(item => item.id !== referenceItemId || referenceVisible)
    .filter(item => !externalElements || isEditorTargetVisible(externalElements.current.get(item.id)))
  const selected = selectableItems.find(item => item.id === selectedId) || selectableItems[0]

  useEffect(() => {
    if (selected?.id !== selectedId) setSelectedId(selected?.id)
  }, [selected?.id, selectedId])

  useEffect(() => {
    if (selected) onSelectionChange?.(selected.id)
  }, [selected?.id, onSelectionChange])

  useEffect(() => {
    if (!import.meta.env.DEV || !draftKey) return undefined
    const draft = localStorage.getItem(`layout-editor:${draftKey}`)
    if (draft) {
      try {
        const parsedItems = JSON.parse(draft)
        const savedItems = migrateDraft(parsedItems)
        const layoutFields = ['x', 'y', 'width', 'height', 'borderRadius', 'rotation', 'zIndex']
        const savedById = new Map(savedItems.map(item => [item.id, item]))
        onChange(items.map(item => {
          const saved = savedById.get(item.id)
          if (!saved) return item
          return layoutFields.reduce((next, field) => {
            if (typeof saved[field] === 'number') next[field] = saved[field]
            return next
          }, { ...item })
        }))
      } catch (error) { console.warn(`[LayoutEditor] Draft preserved: ${draftKey}`, error) }
    }
    return undefined
  }, [draftKey, migrateDraft, onChange])

  useEffect(() => {
    if (!import.meta.env.DEV || !draftKey || !isOpen || !draftDirty.current) return
    try {
      const saved = JSON.parse(localStorage.getItem(`layout-editor:${draftKey}`) || '[]')
      if (!Array.isArray(saved)) throw new Error('Unknown draft format')
      const byId = new Map(saved.map(item => [item.id, item]))
      for (const { id, x, y, width, height, borderRadius, rotation, zIndex } of items) byId.set(id, {
        ...byId.get(id), id, x, y, width, rotation, zIndex,
        ...(typeof height === 'number' ? {height} : {}), ...(typeof borderRadius === 'number' ? {borderRadius} : {}),
      })
      localStorage.setItem(`layout-editor:${draftKey}`, JSON.stringify([...byId.values()]))
      draftDirty.current = false
    } catch (error) { console.warn(`[LayoutEditor] Cannot save ${draftKey}; old draft preserved`, error) }
  }, [draftKey, isOpen, items])

  useEffect(() => () => notifyEditing(false), [])

  useEffect(() => {
    const updateViewportWidth = () => { setViewportWidth(window.innerWidth); setViewportHeight(window.innerHeight) }
    window.addEventListener('resize', updateViewportWidth)
    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('layout-editor-scope', { detail: { id: layoutId, open: isOpen } }))
  }, [isOpen, layoutId])

  const updateItem = (id, patch) => { draftDirty.current = true; onChange(items.map(item => item.id === id ? { ...item, ...patch } : item)) }
  const updateSelected = patch => { if (selected) updateItem(selected.id, patch) }
  const beginPanelDrag = event => {
    if (event.target.closest('select, button, input, textarea')) return
    const rect = panelRef.current.getBoundingClientRect()
    panelDragRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.style.cursor = 'grabbing'
  }
  const movePanel = event => {
    if (!panelDragRef.current) return
    setPanelPosition({
      left: event.clientX - panelDragRef.current.dx,
      top: event.clientY - panelDragRef.current.dy,
    })
  }
  const endPanelDrag = event => {
    panelDragRef.current = null
    event.currentTarget.style.cursor = 'grab'
  }
  const beginDrag = (event, type, targetItem = selected) => {
    event.preventDefault()
    event.stopPropagation()
    if (!targetItem) return
    const element = itemRefs.current[targetItem.id]
    const rect = element?.getBoundingClientRect()
    if (!rect) return
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    interactionRef.current = {
      type,
      pointerId: event.pointerId,
      center,
      start: { x: event.clientX, y: event.clientY },
      item: { ...targetItem },
      distance: Math.hypot(event.clientX - center.x, event.clientY - center.y),
      angle: Math.atan2(event.clientY - center.y, event.clientX - center.x),
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    notifyEditing(true)
    setDebug({ action: type === 'move' ? 'move' : type.startsWith('resize') ? 'resize' : 'rotate', x: event.clientX, y: event.clientY, captured: true })
  }
  const move = event => {
    const interaction = interactionRef.current
    if (!interaction || event.pointerId !== interaction.pointerId) return
    setDebug(current => ({ ...current, x: event.clientX, y: event.clientY }))
    const dx = event.clientX - interaction.start.x
    const dy = event.clientY - interaction.start.y
    if (interaction.type === 'move' && externalElements) {
      const delta = localDragDelta(externalElements.current.get(interaction.item.id), dx, dy)
      updateItem(interaction.item.id, { x: interaction.item.x + delta.x, y: interaction.item.y + delta.y })
    } else if (interaction.type === 'move') {
      const viewportPositioned = stage && interaction.item.coordinateSpace === 'viewport'
      const bounds = containerRect()
      updateItem(interaction.item.id, {
        x: interaction.item.x + dx / (containerRef ? bounds?.width || 1 : viewportPositioned ? viewportWidth : stage ? stage.width * stageScale : innerWidth) * 100,
        y: interaction.item.y + dy / (containerRef ? bounds?.height || 1 : viewportPositioned ? viewportHeight : stage ? stage.height * stageScale : innerHeight) * 100,
      })
    }
    else if (interaction.type === 'rotate') {
      const angle = Math.atan2(event.clientY - interaction.center.y, event.clientX - interaction.center.x)
      updateItem(interaction.item.id, { rotation: interaction.item.rotation + (angle - interaction.angle) * 180 / Math.PI })
    } else {
      const width = clamp(interaction.item.width * Math.max(0.2, Math.hypot(event.clientX - interaction.center.x, event.clientY - interaction.center.y) / Math.max(20, interaction.distance)), 4, externalElements ? 4000 : 300)
      updateItem(interaction.item.id, {
        width,
        ...(scaleHeightWithWidth && typeof interaction.item.height === 'number' ? { height: interaction.item.height * width / interaction.item.width } : {}),
      })
    }
  }
  const end = event => {
    if (!interactionRef.current || event.pointerId !== interactionRef.current.pointerId) return
    event.currentTarget?.releasePointerCapture?.(event.pointerId)
    interactionRef.current = null
    notifyEditing(false)
    setDebug(current => ({ ...current, action: 'idle', captured: false }))
  }
  useEffect(() => {
    if (!showEditor) return undefined
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  })
  const resetSelected = () => {
    const original = initialItems.find(item => item.id === selectedId)
    if (!original) return
    const resetValues = { x: original.x, y: original.y, width: original.width, rotation: original.rotation, zIndex: original.zIndex }
    if (typeof original.height === 'number') resetValues.height = original.height
    if (typeof original.borderRadius === 'number') resetValues.borderRadius = original.borderRadius
    updateSelected(resetValues)
  }
  const copyConfig = async () => {
    const config = JSON.stringify((externalElements ? items.filter(item => item.width > 0 && item.height > 0) : items).map(({ id, selector, coordinateSpace: itemCoordinateSpace, x, y, width, height, borderRadius, rotation, zIndex }) => ({ id, ...(externalElements ? { changedFields: ['x','y','width','height','rotation','zIndex'].filter(field => ({x,y,width,height,rotation,zIndex})[field] !== initialItems.find(item => item.id === id)?.[field]) } : {}), pageId: pageId || document.querySelector('[data-edition-page]')?.dataset.editionPage, ...(selector ? { selector } : {}), ...(typeof height === 'number' ? { height } : {}), ...(typeof borderRadius === 'number' ? { borderRadius } : {}), layoutId, coordinateSpace: externalElements ? 'local-css-px-offset' : itemCoordinateSpace === 'viewport' ? 'viewport-percent' : stage ? 'stage-percent' : containerRef ? 'container-percent' : 'viewport-percent', x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), width: Number(width.toFixed(2)), rotation: Number(rotation.toFixed(2)), zIndex })), null, 2)
    setCopiedConfig(config)
    try { await navigator.clipboard.writeText(config) } catch { /* textarea remains available */ }
  }
  const clearDraft = () => { localStorage.removeItem(`layout-editor:${draftKey}`); setCopiedConfig('') }

  return (
    <>
      {showEditor && referenceImage && <img className="layout-editor-reference" src={referenceImage} alt="" style={{ opacity: referenceVisible ? referenceOpacity : 0 }} />}
      <div className={`layout-editor-stage${externalElements ? ' layout-editor-stage--external' : ''}${containerRef ? ' layout-editor-stage--contained' : ''}${showEditor ? ' is-open' : ''}${hoverEnabled ? ' has-hover' : ''}${interactiveWhenClosed ? ' interactive-closed' : ''}`}>
        <div ref={stageBoxRef} className={`layout-editor-stage-box${stage?.className ? ` ${stage.className}` : ''}`} style={stage ? { visibility: stageBoundsRef && !stageBounds ? 'hidden' : undefined, position: 'absolute', left: 0, top: 0, width: `${stage.width}px`, height: `${stage.height}px`, transformOrigin: '0 0', transform: `translate(${stageOffsetX}px, ${stageOffsetY}px) scale(${stageScale})` } : { display: 'contents' }}>
        {(externalElements ? showEditor ? selectableItems : [] : items)
          .filter(item => !item.editorOnly || showEditor)
          .filter(item => item.id !== referenceItemId || referenceVisible)
          .map(item => {
          const selectable = canSelectItem(item)
          const isHovered = hoverEnabled && !showEditor && hoveredId === item.id
          const hoverOffsetX = item.hoverOffsetX ?? defaultHoverOffsetX
          const hoverRotation = clamp(normalizeRotation(item.rotation) * -0.08, -8, 8)
          const position = itemPosition(item)
          if (item.isNode) return <div key={item.id} id={item.id} ref={element => { itemRefs.current[item.id] = element }} className={`layout-editor-item${showEditor && item.id === selectedId ? ' is-selected' : ''}`} data-layout-id={item.id} onPointerDown={showEditor && selectable ? event => { setSelectedId(item.id); beginDrag(event, 'move', item) } : undefined} style={{ ...position, height: externalElements || typeof item.height === 'number' ? itemHeight(item) : 'auto', zIndex: item.zIndex, aspectRatio: item.ratio, borderRadius: typeof item.borderRadius === 'number' ? `${item.borderRadius}%` : undefined, pointerEvents: selectable ? undefined : 'none', transform: externalElements ? 'none' : `rotate(${item.rotation}deg)` }}>{renderNode?.(item)}</div>
          const itemProps = { id: item.id, ref: element => { itemRefs.current[item.id] = element }, className: `layout-editor-item${showEditor && item.id === selectedId ? ' is-selected' : ''}${isHovered ? ' is-hovered' : ''}`, 'data-layout-id': item.id, 'data-sequence-item-id': item.id, 'data-sequence-fading': item.sequenceFading && !item.groupId ? 'true' : undefined, onPointerEnter: selectable && hoverEnabled && !showEditor ? () => setHoveredId(item.id) : undefined, onPointerLeave: selectable && hoverEnabled && !showEditor ? () => setHoveredId(current => current === item.id ? null : current) : undefined, onClick: selectable && !showEditor && onItemActivate ? event => { event.stopPropagation(); onItemActivate(item.id) } : undefined, onPointerDown: showEditor && selectable ? event => { setSelectedId(item.id); beginDrag(event, 'move', item) } : undefined, style: { ...position, height: item.groupId ? '100%' : 'auto', zIndex: isHovered ? item.zIndex + 100 : item.zIndex, aspectRatio: item.ratio, opacity: item.id === referenceItemId ? referenceOpacity : item.groupId ? 1 : item.opacity ?? 1, pointerEvents: selectable ? undefined : 'none', transform: item.groupId ? 'none' : `translateX(${isHovered ? hoverOffsetX : 0}px) rotate(${isHovered ? item.rotation + hoverRotation : item.rotation}deg)` } }
          const overlay = renderItemOverlay?.(item)
          const image = overlay
            ? <div key={item.id} {...itemProps} className={`${itemProps.className} layout-editor-item-with-overlay`}><img className="layout-editor-item-image" src={item.src} alt="" draggable="false" /><span className="layout-editor-item-overlay">{overlay}</span></div>
            : <img key={item.id} {...itemProps} src={item.src} alt="" draggable="false" />
          return item.groupId
            ? (() => {
              const sourceItem = initialItems.find(source => source.id === item.id) ?? item
              const designWidth = sourceItem.width * 19.2
              const scale = item.width / sourceItem.width * (stage ? stage.width : viewportWidth) / 1920
              return <div key={item.id} className="layout-editor-dialogue-group" data-dialogue-group={item.groupId} data-sequence-item-id={item.id} data-sequence-fading={item.sequenceFading ? 'true' : undefined} style={{ ...itemPosition(item), position: stage ? 'absolute' : undefined, aspectRatio: item.ratio, zIndex: item.zIndex, opacity: item.opacity ?? 1, transform: `rotate(${item.rotation}deg)` }}>
                <div className="layout-editor-dialogue-design-space" style={{ width: `${designWidth}px`, height: `${designWidth / item.ratio}px`, transform: `scale(${scale})` }}>{image}{renderGroupContent?.(item)}</div>
              </div>
            })()
            : image
        })}
        {showEditor && selected && <div className="layout-editor-selection" style={{ position: stage || containerRef ? 'absolute' : 'fixed', ...itemPosition(selected), height: itemHeight(selected), zIndex: 110, transform: externalElements ? 'none' : `rotate(${selected.rotation}deg)` }}>{HANDLE_CORNERS.map(corner => <button key={corner} className={`layout-editor-handle handle-${corner}`} aria-label={`Resize ${corner}`} onPointerDown={event => beginDrag(event, `resize-${corner}`)} />)}<button className="layout-editor-rotate" aria-label="Rotate selected item" onPointerDown={event => beginDrag(event, 'rotate')} /><button className="layout-editor-handle" aria-label="Move selected item" style={{ top: '50%', left: '50%', cursor: 'move', borderRadius: '50%' }} onPointerDown={event => beginDrag(event, 'move')} /></div>}
        </div>
      </div>
      {showEditor && <>
        {createPortal(<aside ref={panelRef} className="layout-editor-panel" style={panelPosition ? { left: panelPosition.left, top: panelPosition.top, right: 'auto' } : undefined}>
          <header
            className="layout-editor-panel-header"
            onPointerDown={beginPanelDrag}
            onPointerMove={movePanel}
            onPointerUp={endPanelDrag}
            onPointerCancel={endPanelDrag}
            style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
          >
            <strong>Layout Editor{externalElements ? ' · DOM' : ''}</strong>
          </header>
          <div>Layout: {layoutId}{externalElements ? ' · local px offsets' : ''}</div>
          <div className="layout-editor-debug">Editor: {showEditor ? 'ON' : 'OFF'}<br />Selected: {selected?.id || 'none'}<br />Action: {debug.action}<br />Pointer: {Math.round(debug.x)}, {Math.round(debug.y)}<br />Pointer captured: {debug.captured ? 'yes' : 'no'}</div>
          <label>Selected<select value={selected?.id ?? ''} onChange={event => setSelectedId(event.target.value)}>{selectableItems.map(item => <option key={item.id} value={item.id}>{item.label || item.id}</option>)}</select></label>
          {[['X', 'x'], ['Y', 'y'], ['Width', 'width'], ...(typeof selected?.height === 'number' ? [['Height', 'height']] : []), ...(typeof selected?.borderRadius === 'number' ? [['Border Radius (%)', 'borderRadius']] : []), ['Rotation', 'rotation'], ['Z-index', 'zIndex']].map(([label, key]) => <label key={key}>{label}<input type="number" step={key === 'zIndex' ? 1 : 0.1} value={selected?.[key] ?? 0} onChange={event => updateSelected({ [key]: key === 'zIndex' ? Math.round(Number(event.target.value)) : Number(event.target.value) })} /></label>)}
          <div className="layout-editor-actions"><button onClick={() => updateSelected({ zIndex: selected.zIndex + 1 })}>Bring Forward</button><button onClick={() => updateSelected({ zIndex: Math.max(stage ? -99 : 1, selected.zIndex - 1) })}>Send Backward</button></div>
          <div className="layout-editor-actions"><button onClick={resetSelected}>Reset Selected</button><button onClick={copyConfig}>Copy Config</button></div>
          {(referenceImage || referenceItemId) && <><label className="layout-editor-check"><input type="checkbox" checked={referenceVisible} onChange={event => setReferenceVisible(event.target.checked)} /> Reference ON / OFF</label><label>Reference opacity<input type="range" min="0" max="1" step="0.01" value={referenceOpacity} onChange={event => setReferenceOpacity(Number(event.target.value))} /></label></>}
          {draftKey && <button onClick={clearDraft}>Clear Draft</button>}
          {copiedConfig && <textarea readOnly value={copiedConfig} aria-label="Copied layout config" />}
        </aside>, document.body)}
      </>}
    </>
  )
}

export default LayoutEditor
