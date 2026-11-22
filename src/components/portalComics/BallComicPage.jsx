import { useCallback, useEffect, useRef, useState } from 'react'
import LayoutEditor from '../../dev/LayoutEditor'
import { usePersistedEditableText } from '../../dev/useEditableText'
import { buildTextStyle, enablePageTextPersistence, selectText } from '../../dev/textEditorStore'
import { useDevEditorState } from '../../dev/devEditorStore'
import { finishComicSequence } from './comicSequence'
import EditionComicControls from './EditionComicControls'
import layoutDefaults from '../ballComicLayout.json'
import textDefaults from '../ballComicTextConfig.json'
import referenceImage from '../../../Art/ball/b-comic/comic.JPG'
import comic1 from '../../../Art/ball/b-comic/b-comic1.PNG'
import comic2 from '../../../Art/ball/b-comic/b-comic2.PNG'
import comic3 from '../../../Art/ball/b-comic/b-comic3.PNG'
import comic4 from '../../../Art/ball/b-comic/b-comic4.PNG'
import comic5 from '../../../Art/ball/b-comic/b-comic5.PNG'
import dialog1 from '../../../Art/ball/b-comic/t-dialog1.PNG'
import dialog2 from '../../../Art/ball/b-comic/t-dialog2.PNG'
import dialog3 from '../../../Art/ball/b-comic/t-dialog3.PNG'
import dialog4 from '../../../Art/ball/b-comic/t-dialog4.PNG'
import dialog5 from '../../../Art/ball/b-comic/t-dialog5.PNG'
import dialog6 from '../../../Art/ball/b-comic/t-dialog6.PNG'
import dialog7 from '../../../Art/ball/b-comic/t-dialog7.PNG'
import dialog8 from '../../../Art/ball/b-comic/t-dialog8.PNG'
import dialog9 from '../../../Art/ball/b-comic/t-dialog9.PNG'
import dialog10 from '../../../Art/ball/b-comic/t-dialog10.PNG'
import dialog11 from '../../../Art/ball/b-comic/t-dialog11.PNG'
import './BallComicPage.css'

const ARTWORK = [
  { id: 'b-comic-reference', label: 'comic.JPG reference', src: referenceImage, ratio: 4033 / 2304, isReference: true, editorOnly: true },
  { id: 'b-comic-1', src: comic1, ratio: 1085 / 829 },
  { id: 'b-comic-2', src: comic2, ratio: 1094 / 995 },
  { id: 'b-comic-3', src: comic3, ratio: 1101 / 1289 },
  { id: 'b-comic-4', src: comic4, ratio: 1076 / 557 },
  { id: 'b-comic-5', src: comic5, ratio: 1101 / 1803 },
  { id: 'b-dialog-1', src: dialog1, ratio: 552 / 730, groupId: 'b-dialogue-group-1' },
  { id: 'b-dialog-2', src: dialog2, ratio: 498 / 658, groupId: 'b-dialogue-group-2' },
  { id: 'b-dialog-3', src: dialog3, ratio: 379 / 477, groupId: 'b-dialogue-group-3' },
  { id: 'b-dialog-4', src: dialog4, ratio: 438 / 699, groupId: 'b-dialogue-group-4' },
  { id: 'b-dialog-5', src: dialog5, ratio: 562 / 754, groupId: 'b-dialogue-group-5' },
  { id: 'b-dialog-6', src: dialog6, ratio: 446 / 657, groupId: 'b-dialogue-group-6' },
  { id: 'b-dialog-7', src: dialog7, ratio: 417 / 540, groupId: 'b-dialogue-group-7' },
  { id: 'b-dialog-8', src: dialog8, ratio: 288 / 308, groupId: 'b-dialogue-group-8' },
  { id: 'b-dialog-9', src: dialog9, ratio: 488 / 1028, groupId: 'b-dialogue-group-9' },
  { id: 'b-dialog-10', src: dialog10, ratio: 535 / 1037, groupId: 'b-dialogue-group-10' },
  { id: 'b-dialog-11', src: dialog11, ratio: 428 / 676, groupId: 'b-dialogue-group-11' },
]

const LAYOUT_STORAGE_KEY = 'layout-editor:b-comic:2026-11-18-v5'
const LAYOUT_FIELDS = ['x', 'y', 'width', 'height', 'rotation', 'zIndex']
const DEFAULT_LAYOUT_BY_ID = new Map(layoutDefaults.map(item => [item.id, item]))
const SEQUENCE = [
  'b-comic-1',
  'b-dialog-1',
  'b-dialog-2',
  'b-dialog-3',
  'b-comic-2',
  'b-dialog-4',
  'b-comic-3',
  'b-dialog-5',
  'b-dialog-6',
  'b-dialog-7',
  'b-comic-4',
  'b-dialog-8',
  'b-comic-5',
  'b-dialog-10',
  'b-dialog-9',
  'b-dialog-11',
]
const AUTO_FOLLOW_STEPS = new Map([[0, 1], [9, 10], [10, 11], [13, 14]])
const INITIAL_DIALOG_DELAY_MS = 1400
const AUTO_FOLLOW_DELAY_MS = 100
const FADE_DURATION_MS = 560
const DIALOGUE_TEXT_DEFAULTS = Object.fromEntries(
  Object.entries(textDefaults.registered).map(([id, { coordinateSpace, ...values }]) => [id, values]),
)
const CONFIGURED_TEXT_DEFAULTS = Object.fromEntries(
  Object.entries(textDefaults.registered)
    .filter(([id]) => !id.startsWith('ball-comic-dialog-text-'))
    .map(([id, { coordinateSpace, ...values }]) => [id, values]),
)
const CONFIGURED_TEXT_SOURCE_KEYS = Object.fromEntries(
  Object.entries(CONFIGURED_TEXT_DEFAULTS).map(([id, values]) => [
    id,
    Object.keys(values).filter(key => values[key] !== null),
  ]),
)
const DIALOGUE_TEXT_SOURCE_KEYS = Object.fromEntries(
  Object.entries(DIALOGUE_TEXT_DEFAULTS).map(([id, values]) => [
    id,
    Object.keys(values).filter(key => values[key] !== null),
  ]),
)
function ConfiguredBallText({ id, as: Tag = 'span' }) {
  const defaultValues = CONFIGURED_TEXT_DEFAULTS[id]
  const sourceDefaultKeys = CONFIGURED_TEXT_SOURCE_KEYS[id]
  const initialStyle = buildTextStyle({ defaults: defaultValues, values: defaultValues, sourceDefaultKeys })
  const editable = usePersistedEditableText({
    id,
    label: `Ball Comic / ${id.replace('ball-comic-', '')}`,
    defaultValues,
    sourceRevision: textDefaults.revision,
    sourceRevisionStrategy: 'replace',
    sourceDefaultKeys,
  })

  return (
    <Tag
      id={id}
      ref={editable.ref}
      {...editable.props}
      style={{ ...initialStyle, ...editable.props.style }}
    >
      {editable.text ?? editable.defaultText ?? defaultValues.text}
    </Tag>
  )
}

function DialogueText({ number }) {
  const id = `ball-comic-dialog-text-${number}`
  const defaultValues = DIALOGUE_TEXT_DEFAULTS[id]
  const sourceDefaultKeys = DIALOGUE_TEXT_SOURCE_KEYS[id]
  const initialStyle = buildTextStyle({ defaults: defaultValues, values: defaultValues, sourceDefaultKeys })
  const editable = usePersistedEditableText({
    id,
    label: `Ball Comic / Dialog ${number}`,
    coordinateSpace: 'dialogue-group',
    defaultValues,
    sourceRevision: textDefaults.revision,
    sourceRevisionStrategy: 'replace',
    sourceDefaultKeys,
  })
  const editableStyle = editable.props.style

  return (
    <div
      id={id}
      ref={editable.ref}
      {...editable.props}
      data-text-editor-resizable=""
      style={{ ...initialStyle, ...editableStyle, ...(editableStyle?.height != null ? { maxHeight: 'none' } : {}) }}
      className="b-comic-dialogue-text"
    >
      {editable.text ?? editable.defaultText ?? defaultValues.text}
      <span className="b-comic-dialogue-resize-handle b-comic-dialogue-resize-handle--top" aria-hidden="true" />
      <span className="b-comic-dialogue-resize-handle b-comic-dialogue-resize-handle--bottom" aria-hidden="true" />
      <span className="b-comic-dialogue-resize-handle b-comic-dialogue-resize-handle--top-left" aria-hidden="true" />
      <span className="b-comic-dialogue-resize-handle b-comic-dialogue-resize-handle--top-right" aria-hidden="true" />
      <span className="b-comic-dialogue-resize-handle b-comic-dialogue-resize-handle--bottom-left" aria-hidden="true" />
      <span className="b-comic-dialogue-resize-handle b-comic-dialogue-resize-handle--bottom-right" aria-hidden="true" />
    </div>
  )
}

function loadLayout(items) {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY) || 'null')
    if (!Array.isArray(saved)) return items
    const savedById = new Map(saved.filter(item => item && typeof item.id === 'string').map(item => [item.id, item]))
    return items.map(item => LAYOUT_FIELDS.reduce((next, field) => {
      if (Number.isFinite(savedById.get(item.id)?.[field])) next[field] = savedById.get(item.id)[field]
      return next
    }, { ...item }))
  } catch {
    return items
  }
}

export default function BallComicPage({ onContinue, onBack }) {
  const [initialItems] = useState(() => ARTWORK.map(item => ({ ...item, ...DEFAULT_LAYOUT_BY_ID.get(item.id) })))
  const [items, setItems] = useState(() => loadLayout(initialItems))
  const [visibleThrough, setVisibleThrough] = useState(-1)
  const [activeFadeIndex, setActiveFadeIndex] = useState(null)
  const [completedIndex, setCompletedIndex] = useState(-1)
  const frameRef = useRef(null)
  const busyRef = useRef(false)
  const requestFrameRef = useRef(null)
  const timersRef = useRef(new Set())
  const finishedRef = useRef(false)
  const onContinueRef = useRef(onContinue)
  const { active } = useDevEditorState()
  const isImageEditorOpen = import.meta.env.DEV && active?.kind === 'img'
  const isTextEditorOpen = import.meta.env.DEV && active?.kind === 'text'
  const isItemEditorOpen = isImageEditorOpen || isTextEditorOpen

  onContinueRef.current = onContinue

  useEffect(() => {
    if (!import.meta.env.DEV) return enablePageTextPersistence('ball-comic', 'ball-comic-', { readOnly: true })
  }, [])

  const updateItems = useCallback(nextItems => {
    setItems(nextItems)
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(nextItems.map(item => ({
        id: item.id,
        ...Object.fromEntries(LAYOUT_FIELDS.map(field => [field, item[field]])),
      }))))
    } catch {
      // The published layout remains usable if browser storage is unavailable.
    }
  }, [])

  const revealStep = index => {
    if (finishedRef.current || busyRef.current || index >= SEQUENCE.length) return
    busyRef.current = true
    setActiveFadeIndex(index)
    requestFrameRef.current = window.requestAnimationFrame(() => {
      setVisibleThrough(index)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        busyRef.current = false
        setCompletedIndex(index)
        setActiveFadeIndex(null)
      }
    })
  }

  useEffect(() => {
    revealStep(0)
    return () => {
      if (requestFrameRef.current !== null) window.cancelAnimationFrame(requestFrameRef.current)
      timersRef.current.forEach(window.clearTimeout)
      timersRef.current.clear()
      busyRef.current = false
    }
  }, [])

  useEffect(() => {
    const nextIndex = AUTO_FOLLOW_STEPS.get(completedIndex)
    if (finishedRef.current || nextIndex === undefined || isItemEditorOpen) return undefined
    const delay = completedIndex === 0 ? INITIAL_DIALOG_DELAY_MS : AUTO_FOLLOW_DELAY_MS
    const timer = window.setTimeout(() => {
      revealStep(nextIndex)
    }, delay)
    timersRef.current.add(timer)
    return () => {
      window.clearTimeout(timer)
      timersRef.current.delete(timer)
    }
  }, [completedIndex, isItemEditorOpen])

  useEffect(() => {
    if (!isItemEditorOpen || activeFadeIndex === null) return
    if (requestFrameRef.current !== null) window.cancelAnimationFrame(requestFrameRef.current)
    busyRef.current = false
    setVisibleThrough(activeFadeIndex)
    setCompletedIndex(activeFadeIndex)
    setActiveFadeIndex(null)
  }, [activeFadeIndex, isItemEditorOpen])

  const handleFadeComplete = event => {
    if (finishedRef.current || event.propertyName !== 'opacity' || activeFadeIndex === null) return
    if (event.target.dataset.sequenceItemId !== SEQUENCE[activeFadeIndex]) return
    setCompletedIndex(activeFadeIndex)
    setActiveFadeIndex(null)
    busyRef.current = false
  }

  const finishComic = () => {
    const finished = finishComicSequence({
      finishedRef,
      busyRef,
      requestFrameRef,
      timersRef,
      cancelFrame: id => window.cancelAnimationFrame(id),
      clearTimer: id => window.clearTimeout(id),
    })
    if (!finished) return
    setVisibleThrough(SEQUENCE.length - 1)
    setCompletedIndex(SEQUENCE.length - 1)
    setActiveFadeIndex(null)
    onContinueRef.current?.()
  }

  const handleStageClick = event => {
    if (finishedRef.current || isItemEditorOpen || busyRef.current || event.target.closest('.layout-editor-panel, .text-editor-panel, .dev-editor-launcher, button')) return
    if (completedIndex === SEQUENCE.length - 1) {
      finishComic()
      return
    }
    if (completedIndex < 1 || AUTO_FOLLOW_STEPS.has(completedIndex)) return
    revealStep(completedIndex + 1)
  }

  const handleKeyDown = event => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleStageClick(event)
    }
    if (event.key === 'Escape') onBack?.()
  }

  const visibleItems = items.map(item => {
    const sequenceIndex = SEQUENCE.indexOf(item.id)
    const editorOverride = isItemEditorOpen
    return {
      ...item,
      opacity: item.editorOnly ? 1 : editorOverride || sequenceIndex <= visibleThrough ? 1 : 0,
      sequenceFading: sequenceIndex === activeFadeIndex && !editorOverride,
    }
  })
  const canContinue = completedIndex === SEQUENCE.length - 1 && activeFadeIndex === null
  const handleSelectionChange = useCallback(itemId => {
    const match = /^b-dialog-(\d+)$/.exec(itemId)
    if (match) selectText(`ball-comic-dialog-text-${match[1]}`)
  }, [])

  return <main
    className="portal-comic b-comic-page"
    aria-label="OUR FAVORITES! comic introduction"
    aria-busy={activeFadeIndex !== null}
    data-reading-step={completedIndex}
    tabIndex={0}
    onClick={handleStageClick}
    onKeyDown={handleKeyDown}
    onTransitionEnd={handleFadeComplete}
    style={{ '--b-comic-fade-duration': `${FADE_DURATION_MS}ms` }}
  >
    <EditionComicControls
      onBack={onBack}
      onStart={finishComic}
      startLabel="開始探索"
      title={<div className="b-comic-title"><ConfiguredBallText as="h1" id="ball-comic-title" /></div>}
    />
    <div className="edition-comic-frame-heading" aria-hidden="true" />
    <section ref={node => { frameRef.current = node }} className="b-comic-frame edition-comic-frame" aria-label="Ball comic artwork">
      <div className="b-comic-fit">
        <LayoutEditor
          pageId="ball-comic"
          items={visibleItems}
          initialItems={initialItems}
          onChange={updateItems}
          referenceItemId="b-comic-reference"
          layoutId="b-comic"
          stage={{ width: 1920, height: 1080 }}
          fitContent={false}
          scaleHeightWithWidth
          stageBoundsRef={frameRef}
          onSelectionChange={handleSelectionChange}
          renderGroupContent={item => {
            const match = /^b-dialog-(\d+)$/.exec(item.id)
            return match ? <DialogueText key={`ball-comic-dialog-text-${match[1]}`} number={Number(match[1])} /> : null
          }}
        />
      </div>
    </section>
    <button
      className={`portal-comic__continue edition-comic-frame-footer${canContinue ? ' is-visible' : ''}`}
      onClick={onContinue}
      onPointerDown={event => event.stopPropagation()}
      disabled={!canContinue}
      aria-hidden={!canContinue}
      tabIndex={canContinue ? 0 : -1}
    ><ConfiguredBallText id="ball-comic-continue" /></button>
  </main>
}
