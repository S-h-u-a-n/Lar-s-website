import { useEffect, useRef, useState } from 'react'
import './TextEditor.css'
import { localDragDelta, isEditorTargetVisible } from './editorCoordinates'
import { useDevEditorState } from './devEditorStore'
import {
  addDraft,
  deleteDraft,
  getMountedTextIds,
  getPageTextIds,
  getTextConfig,
  getTextCoordinateSpace,
  getTextElement,
  getTextValues,
  isCenteredPercentCoordinateSpace,
  resetTexts,
  selectText,
  updateText,
  useTextEditorState,
} from './textEditorStore'

const UI_SELECTOR = '.text-editor-panel, .layout-editor-panel, .model-editor-panel, .dev-editor-launcher'
const ALIGNMENTS = ['left', 'center', 'right']
const WRITING_MODES = [
  { value: 'horizontal-tb', label: 'Horizontal' },
  { value: 'vertical-rl', label: 'Vertical RL' },
  { value: 'vertical-lr', label: 'Vertical LR' },
]

function NumberField({ label, value, onChange, step = 1, min, max, nullable = false }) {
  const toDraft = number => (number == null ? '' : String(number))
  const [draft, setDraft] = useState(toDraft(value))

  useEffect(() => {
    setDraft(current => (Number(current) === value && current !== '') || (current === '' && value == null) ? current : toDraft(value))
  }, [value])

  const handleChange = event => {
    const next = event.target.value
    setDraft(next)
    if (next === '') {
      if (nullable) onChange(null)
      return
    }
    const number = Number(next)
    if (Number.isFinite(number)) onChange(number)
  }

  return (
    <label>
      {label}
      <input type="number" step={step} min={min} max={max} value={draft} placeholder={nullable ? 'auto' : undefined} onChange={handleChange} />
    </label>
  )
}

function TextEditorPanel({ selectedId, pageId }) {
  const { data } = useTextEditorState()
  const mounted = getPageTextIds(pageId)
  const entry = data[selectedId]
  const usesCenteredPercentPosition = entry?.coordinateSpace === 'container-percent-center'
  const usesCenteredPercentCoordinates = isCenteredPercentCoordinateSpace(entry?.coordinateSpace)
  const [position, setPosition] = useState(null)
  const [output, setOutput] = useState('')
  const panelRef = useRef(null)
  const dragRef = useRef(null)
  const previousWeightRef = useRef({ id: selectedId, weight: 400 })
  const values = entry?.values
  const isDraft = entry?.type === 'draft'
  const set = patch => updateText(selectedId, patch)
  const isBold = (values?.fontWeight ?? 400) >= 700

  useEffect(() => {
    if (!values) return
    if (previousWeightRef.current.id !== selectedId) {
      previousWeightRef.current = { id: selectedId, weight: values.fontWeight < 700 ? values.fontWeight : 400 }
    } else if (values.fontWeight < 700) {
      previousWeightRef.current.weight = values.fontWeight
    }
  }, [selectedId, values?.fontWeight])

  const toggleBold = () => {
    if (isBold) {
      const restoreWeight = previousWeightRef.current.id === selectedId ? previousWeightRef.current.weight : 400
      set({ fontWeight: restoreWeight })
    } else {
      previousWeightRef.current = { id: selectedId, weight: values.fontWeight }
      set({ fontWeight: 700 })
    }
  }

  const beginPanelDrag = event => {
    if (event.target.closest('select, button')) return
    const rect = panelRef.current.getBoundingClientRect()
    dragRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const movePanel = event => {
    if (!dragRef.current) return
    setPosition({ left: event.clientX - dragRef.current.dx, top: event.clientY - dragRef.current.dy })
  }
  const copyConfig = () => {
    const json = JSON.stringify(getTextConfig(pageId), null, 2)
    setOutput(json)
    navigator.clipboard?.writeText(json).catch(() => {})
  }

  return (
    <aside
      ref={panelRef}
      className="text-editor-panel"
      style={position ? { left: position.left, top: position.top, right: 'auto' } : undefined}
    >
      <header onPointerDown={beginPanelDrag} onPointerMove={movePanel} onPointerUp={() => { dragRef.current = null }}>
        <strong>Text Editor</strong>
        <button type="button" onClick={() => addDraft(pageId)}>+ Add Text</button>
        {mounted.length > 0 && (
          <select value={selectedId} onChange={event => selectText(event.target.value)}>
            {mounted.map(id => <option key={id} value={id}>{data[id].label}</option>)}
          </select>
        )}
      </header>
      {entry && <div className="text-editor-body">
        {usesCenteredPercentCoordinates ? <>
          <NumberField label="Center X (%)" value={values.x} onChange={x => set({ x })} />
          <NumberField label="Center Y (%)" value={values.y} onChange={y => set({ y })} />
          {usesCenteredPercentPosition && <>
            <NumberField label="整體文字大小 (%)" value={values.fontScale ?? entry.defaults.fontScale ?? 100} step={5} min={50} max={200} onChange={fontScale => set({ fontScale })} />
            <p className="text-editor-position-help">13 張物件筆記共用位置與整體大小。</p>
          </>}
        </> : <>
          <label className="is-wide">Text<textarea rows={3} value={values.text} onChange={event => set({ text: event.target.value })} /></label>
          <NumberField label="X (px)" value={values.x} onChange={x => set({ x })} />
          <NumberField label="Y (px)" value={values.y} onChange={y => set({ y })} />
          <NumberField label="Width (px)" value={values.width} nullable min={0} onChange={width => set({ width })} />
          <NumberField label="Max width (px)" value={values.maxWidth} nullable min={0} onChange={maxWidth => set({ maxWidth })} />
          <NumberField label="Height (px)" value={values.height} nullable min={0} onChange={height => set({ height })} />
          <NumberField label="Max height (px)" value={values.maxHeight} nullable min={0} onChange={height => set({ height })} />
          <NumberField label="Font size (px)" value={values.fontSize} min={1} onChange={fontSize => set({ fontSize })} />
          <NumberField label="Font weight" value={values.fontWeight} step={100} min={100} max={900} onChange={fontWeight => set({ fontWeight })} />
          <label>Writing Mode
            <select value={values.writingMode} onChange={event => set({ writingMode: event.target.value })}>
              {WRITING_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </select>
          </label>
          <label>Layer
            <span className="text-editor-layer-control">
              <output>{values.zIndex}</output>
              <button type="button" aria-label="Move text layer down" disabled={values.zIndex <= 0} onClick={() => set({ zIndex: Math.max(0, values.zIndex - 1) })}>Move Down</button>
              <button type="button" aria-label="Move text layer up" onClick={() => set({ zIndex: values.zIndex + 1 })}>Move Up</button>
            </span>
          </label>
          <button className="text-editor-bold-toggle" type="button" aria-pressed={isBold} onClick={toggleBold}>Bold</button>
          <NumberField label="Line height" value={values.lineHeight} step={0.05} min={0} onChange={lineHeight => set({ lineHeight })} />
          <NumberField label="Letter spacing (px)" value={values.letterSpacing} step={0.1} onChange={letterSpacing => set({ letterSpacing })} />
          <NumberField label="Rotation (deg)" value={values.rotation} step={0.1} onChange={rotation => set({ rotation })} />
          <NumberField label="Opacity" value={values.opacity} step={0.05} min={0} max={1} onChange={opacity => set({ opacity })} />
          <label className="is-wide">Font family<input type="text" value={values.fontFamily} onChange={event => set({ fontFamily: event.target.value })} /></label>
          <label>Align
            <select value={values.textAlign} onChange={event => set({ textAlign: event.target.value })}>
              {(ALIGNMENTS.includes(values.textAlign) ? ALIGNMENTS : [values.textAlign, ...ALIGNMENTS]).map(alignment => <option key={alignment}>{alignment}</option>)}
            </select>
          </label>
          <label>Color
            <span className="text-editor-color">
              <input type="color" value={values.color} onChange={event => set({ color: event.target.value })} />
              <input type="text" value={values.color} onChange={event => set({ color: event.target.value })} />
            </span>
          </label>
        </>}
      </div>}
      <div className="text-editor-actions">
        {entry && usesCenteredPercentCoordinates && <>
          <button type="button" onClick={() => updateText(selectedId, { x: values.x, y: values.y })}>儲存排版</button>
          <button type="button" onClick={() => updateText(selectedId, { x: entry.defaults.x, y: entry.defaults.y })}>重設位置</button>
        </>}
        {entry && usesCenteredPercentPosition && <>
          <button type="button" onClick={() => updateText(selectedId, { fontScale: entry.defaults.fontScale ?? 100 })}>重設大小</button>
        </>}
        {entry && <button type="button" onClick={() => resetTexts([selectedId])}>Reset Selected</button>}
        {isDraft && <button type="button" onClick={() => addDraft(pageId, values)}>Duplicate</button>}
        {isDraft && <button type="button" onClick={() => deleteDraft(selectedId)}>Delete Draft</button>}
        {entry && <button type="button" onClick={() => resetTexts(getPageTextIds(pageId))}>Reset Page</button>}
        <button type="button" onClick={copyConfig}>Copy Config</button>
      </div>
      {output && <textarea className="text-editor-output" readOnly rows={8} value={output} onFocus={event => event.target.select()} />}
    </aside>
  )
}

function TextEditor({ pageId }) {
  const { active } = useDevEditorState()
  const { selectedId } = useTextEditorState()
  const mounted = getPageTextIds(pageId)
  const isActive = active?.kind === 'text'
  const currentId = mounted.includes(selectedId) ? selectedId : mounted[0]

  // Hit-test by rect in the capture phase so text can be picked/dragged even under the canvas, without reaching it.
  useEffect(() => {
    if (!isActive) return undefined
    let drag = null
    const isUi = target => target instanceof Element && target.closest(UI_SELECTOR)
    const hitTest = event => {
      let best = null
      let bestArea = Infinity
      getPageTextIds(pageId).forEach(id => {
        const rect = getTextElement(id)?.getBoundingClientRect()
        if (!isEditorTargetVisible(getTextElement(id)) || !rect || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return
        const area = rect.width * rect.height
        if (area < bestArea) {
          best = id
          bestArea = area
        }
      })
      return best
    }
    const handleDown = event => {
      if (event.button !== 0 || isUi(event.target)) return
      const selectedElement = getTextElement(selectedId)
      const selectedRect = selectedElement?.getBoundingClientRect()
      if (selectedElement?.hasAttribute('data-text-editor-resizable') && isEditorTargetVisible(selectedElement) && selectedRect) {
        const leftDistance = Math.abs(event.clientX - selectedRect.left)
        const rightDistance = Math.abs(event.clientX - selectedRect.right)
        const topDistance = Math.abs(event.clientY - selectedRect.top)
        const bottomDistance = Math.abs(event.clientY - selectedRect.bottom)
        const horizontalEdge = Math.min(leftDistance, rightDistance) <= 10
          && (event.clientY >= selectedRect.top && event.clientY <= selectedRect.bottom || Math.min(topDistance, bottomDistance) <= 10)
        const verticalEdge = Math.min(topDistance, bottomDistance) <= 10
          && (event.clientX >= selectedRect.left && event.clientX <= selectedRect.right || Math.min(leftDistance, rightDistance) <= 10)
        if (horizontalEdge || verticalEdge) {
          const values = getTextValues(selectedId)
          const width = Number.parseFloat(getComputedStyle(selectedElement).width)
          const height = Number.parseFloat(getComputedStyle(selectedElement).height)
          if (values && Number.isFinite(width) && Number.isFinite(height)) {
            event.preventDefault()
            event.stopPropagation()
            drag = {
              id: selectedId,
              mode: {
                west: horizontalEdge && leftDistance <= rightDistance,
                east: horizontalEdge && rightDistance < leftDistance,
                north: verticalEdge && topDistance <= bottomDistance,
                south: verticalEdge && bottomDistance < topDistance,
              },
              startX: event.clientX,
              startY: event.clientY,
              originX: values.x,
              originY: values.y,
              width,
              height,
            }
            return
          }
        }
      }
      const id = hitTest(event)
      if (!id) {
        if (event.target instanceof Element && event.target.closest('canvas')) { event.preventDefault(); event.stopPropagation() }
        return
      }
      event.preventDefault()
      event.stopPropagation()
      selectText(id)
      const { x, y } = getTextValues(id)
      drag = { id, startX: event.clientX, startY: event.clientY, originX: x, originY: y }
    }
    const handleMove = event => {
      if (!drag) return
      event.stopPropagation()
      const element = getTextElement(drag.id)
      const delta = localDragDelta(element, event.clientX - drag.startX, event.clientY - drag.startY)
      const localDeltaX = delta.x, localDeltaY = delta.y
      if (isCenteredPercentCoordinateSpace(getTextCoordinateSpace(drag.id))) {
        const container = element?.offsetParent
        if (!container?.clientWidth || !container?.clientHeight) return
        const x = drag.originX + localDeltaX / container.clientWidth * 100
        const y = drag.originY + localDeltaY / container.clientHeight * 100
        updateText(drag.id, {
          x: Math.round(Math.max(0, Math.min(100, x)) * 100) / 100,
          y: Math.round(Math.max(0, Math.min(100, y)) * 100) / 100,
        })
        return
      }
      if (drag.mode) {
        const patch = {}
        if (drag.mode.west || drag.mode.east) {
          const width = Math.max(1, Math.round(drag.width + (drag.mode.west ? -localDeltaX : localDeltaX)))
          patch.width = width
          if (drag.mode.west) patch.x = Math.round(drag.originX + drag.width - width)
        }
        if (drag.mode.north || drag.mode.south) {
          const height = Math.max(1, Math.round(drag.height + (drag.mode.north ? -localDeltaY : localDeltaY)))
          patch.height = height
          if (drag.mode.north) patch.y = Math.round(drag.originY + drag.height - height)
        }
        updateText(drag.id, patch)
        return
      }
      updateText(drag.id, {
        x: Math.round(drag.originX + localDeltaX),
        y: Math.round(drag.originY + localDeltaY),
      })
    }
    const handleUp = event => {
      if (!drag) return
      event.stopPropagation()
      drag = null
    }
    const handleClick = event => {
      if (isUi(event.target) || !hitTest(event)) return
      event.preventDefault()
      event.stopPropagation()
    }
    const options = { capture: true }
    window.addEventListener('pointerdown', handleDown, options)
    window.addEventListener('pointermove', handleMove, options)
    window.addEventListener('pointerup', handleUp, options)
    window.addEventListener('pointercancel', handleUp, options)
    window.addEventListener('click', handleClick, options)
    return () => {
      window.removeEventListener('pointerdown', handleDown, options)
      window.removeEventListener('pointermove', handleMove, options)
      window.removeEventListener('pointerup', handleUp, options)
      window.removeEventListener('pointercancel', handleUp, options)
      window.removeEventListener('click', handleClick, options)
    }
  }, [isActive, pageId, selectedId])

  useEffect(() => {
    if (!isActive) return undefined
    const marked = mounted.map(id => getTextElement(id)).filter(Boolean)
    marked.forEach(element => element.setAttribute('data-text-editor-active', ''))
    getTextElement(currentId)?.setAttribute('data-text-editor-selected', '')
    return () => marked.forEach(element => {
      element.removeAttribute('data-text-editor-active')
      element.removeAttribute('data-text-editor-selected')
    })
  }, [isActive, mounted, currentId])

  if (!isActive) return null
  return <TextEditorPanel selectedId={currentId} pageId={pageId} />
}

export default TextEditor
