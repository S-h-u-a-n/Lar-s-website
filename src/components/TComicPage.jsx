import { useCallback, useEffect, useRef, useState } from 'react'
import LayoutEditor from '../dev/LayoutEditor'
import layoutDefaults from './tComicLayout.json'
import subtitleConfig from './tComicTextConfig.json'
import { useDevEditorState } from '../dev/devEditorStore'
import { usePersistedEditableText } from '../dev/useEditableText'
import { buildTextStyle, enablePageTextPersistence } from '../dev/textEditorStore'
import EditionComicControls from './portalComics/EditionComicControls'
import './TComicPage.css'
import './portalComics/ComicPages.css'
import comic1 from '../../Art/telescope/t-comic/t-comic1.PNG'
import comic2 from '../../Art/telescope/t-comic/t-comic2.PNG'
import comic3 from '../../Art/telescope/t-comic/t-comic3.PNG'
import comic4 from '../../Art/telescope/t-comic/t-comic4.PNG'
import comic5 from '../../Art/telescope/t-comic/t-comic5.PNG'
import dialog1 from '../../Art/telescope/t-comic/t-dialog1.PNG'
import dialog2 from '../../Art/telescope/t-comic/t-dialog2.PNG'
import dialog3 from '../../Art/telescope/t-comic/t-dialog3.PNG'
import dialog4 from '../../Art/telescope/t-comic/t-dialog4.PNG'
import dialog5 from '../../Art/telescope/t-comic/t-dialog5.PNG'
import dialog6 from '../../Art/telescope/t-comic/t-dialog6.PNG'
import dialog7 from '../../Art/telescope/t-comic/t-dialog7.PNG'
import dialog8 from '../../Art/telescope/t-comic/t-dialog8.PNG'
import dialog9 from '../../Art/telescope/t-comic/t-dialog9.PNG'
import dialog10 from '../../Art/telescope/t-comic/t-dialog10.PNG'
import dialog11 from '../../Art/telescope/t-comic/t-dialog11.PNG'

const COMIC_PANELS = [
  { id: 't-comic-1', src: comic1, ratio: 1367 / 1535 },
  { id: 't-comic-2', src: comic2, ratio: 1091 / 761 },
  { id: 't-comic-3', src: comic3, ratio: 1242 / 1977 },
  { id: 't-comic-4', src: comic4, ratio: 1197 / 824 },
  { id: 't-comic-5', src: comic5, ratio: 1402 / 1366 },
]

const DIALOGUE_IMAGES = [
  { id: 't-dialog-1', src: dialog1, ratio: 706 / 957 },
  { id: 't-dialog-2', src: dialog2, ratio: 522 / 727 },
  { id: 't-dialog-3', src: dialog3, ratio: 530 / 689 },
  { id: 't-dialog-4', src: dialog4, ratio: 328 / 355 },
  { id: 't-dialog-5', src: dialog5, ratio: 901 / 888 },
  { id: 't-dialog-6', src: dialog6, ratio: 365 / 572 },
  { id: 't-dialog-7', src: dialog7, ratio: 305 / 513 },
  { id: 't-dialog-8', src: dialog8, ratio: 546 / 581 },
  { id: 't-dialog-9', src: dialog9, ratio: 604 / 768 },
  { id: 't-dialog-10', src: dialog10, ratio: 611 / 705 },
  { id: 't-dialog-11', src: dialog11, ratio: 641 / 593 },
]

// New published layout revision: older drafts stay untouched and cannot override it.
const LAYOUT_STORAGE_KEY = 'layout-editor:t-comic:2026-10-10-user-config-v1'
const LAYOUT_FIELDS = ['x', 'y', 'width', 'rotation', 'zIndex']
const DEFAULT_LAYOUT_BY_ID = new Map(layoutDefaults.map(item => [item.id, item]))

function loadLayoutItems(defaults) {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!raw) return defaults
    const saved = JSON.parse(raw)
    if (!Array.isArray(saved)) return defaults
    const savedById = new Map(saved.filter(item => item && typeof item.id === 'string').map(item => [item.id, item]))
    return defaults.map(item => {
      const draft = savedById.get(item.id)
      return LAYOUT_FIELDS.reduce((next, field) => {
        if (Number.isFinite(draft?.[field])) next[field] = draft[field]
        return next
      }, { ...item })
    })
  } catch {
    // Keep malformed or inaccessible storage intact; use the published defaults.
    return defaults
  }
}

const SEQUENCE = [
  't-comic-1',
  't-dialog-1',
  't-comic-2',
  't-dialog-2',
  't-dialog-3',
  't-comic-3',
  't-dialog-4',
  't-dialog-5',
  't-comic-4',
  't-dialog-6',
  't-dialog-7',
  't-dialog-8',
  't-comic-5',
  't-dialog-9',
  't-dialog-10',
  't-dialog-11',
]

const FADE_DURATION_MS = 560
const AUTO_FOLLOW_STEPS = {
  5: 6,
  9: 10,
  12: 13,
  14: 15,
}
const AUTO_FOLLOW_DELAY_MS = 80
const DIALOGUE_TEXT_DEFAULTS = Object.fromEntries(Object.entries(subtitleConfig.registered).map(([id, { coordinateSpace, ...values }]) => [Number(id.replace('t-dialog-text-', '')), values]))
const CONTINUE_TEXT_ID = 'codex-t-comic-dom-button-rqpsuk'
const CONTINUE_TEXT_DEFAULTS = Object.fromEntries(
  Object.entries(subtitleConfig.registered[CONTINUE_TEXT_ID]).filter(([key]) => key !== 'selector' && key !== 'coordinateSpace'),
)
const CONTINUE_TEXT_STYLE_KEYS = ['fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'color']

function DialogueText({ number }) {
  const id = `t-dialog-text-${number}`
  const editable = usePersistedEditableText({
    id,
    label: `Telescope / Dialog ${number}`,
    coordinateSpace: 'dialogue-group',
    sourceRevision: subtitleConfig.revision,
    sourceRevisionStrategy: 'replace',
    defaultValues: DIALOGUE_TEXT_DEFAULTS[number],
  })

  return (
    <div id={id} ref={editable.ref} {...editable.props} style={{ ...buildTextStyle({ sourceDefaultKeys: Object.keys(DIALOGUE_TEXT_DEFAULTS[number]), defaults: DIALOGUE_TEXT_DEFAULTS[number], values: DIALOGUE_TEXT_DEFAULTS[number] }), ...editable.props.style, whiteSpace: 'pre-wrap' }} className="t-comic-dialogue-text">
      {editable.text ?? editable.defaultText ?? DIALOGUE_TEXT_DEFAULTS[number].text}
    </div>
  )
}

function ContinueText() {
  const editable = usePersistedEditableText({
    id: CONTINUE_TEXT_ID,
    label: 'Telescope / Continue',
    sourceRevision: subtitleConfig.revision,
    sourceRevisionStrategy: 'replace',
    sourceDefaultKeys: CONTINUE_TEXT_STYLE_KEYS,
    defaultValues: CONTINUE_TEXT_DEFAULTS,
  })
  const style = buildTextStyle({
    defaults: CONTINUE_TEXT_DEFAULTS,
    values: CONTINUE_TEXT_DEFAULTS,
    sourceDefaultKeys: CONTINUE_TEXT_STYLE_KEYS,
  })

  return <span id={CONTINUE_TEXT_ID} ref={editable.ref} {...editable.props} style={{ ...style, ...editable.props.style }}>
    {editable.text ?? editable.defaultText ?? CONTINUE_TEXT_DEFAULTS.text}
  </span>
}

function TComicPage({ onComplete, onBack }) {
  // Development persistence is owned by PageEditors; production only restores.
  useEffect(() => {
    if (!import.meta.env.DEV) return enablePageTextPersistence('t-comic', 't-comic-', { readOnly: true })
  }, [])
  const [initialItems] = useState(() => [
    ...COMIC_PANELS,
    ...DIALOGUE_IMAGES.map((item, index) => ({ ...item, groupId: `dialogue-group-${index + 1}` })),
  ].map(item => ({ ...item, ...DEFAULT_LAYOUT_BY_ID.get(item.id) })))
  const [items, setItems] = useState(() => loadLayoutItems(initialItems))
  const [visibleThrough, setVisibleThrough] = useState(-1)
  const [activeFadeIndex, setActiveFadeIndex] = useState(null)
  const [completedIndex, setCompletedIndex] = useState(-1)
  const canContinue = completedIndex === SEQUENCE.length - 1 && activeFadeIndex === null
  const { active } = useDevEditorState()
  const isImageEditorOpen = import.meta.env.DEV && active?.kind === 'img'
  const isTextEditorOpen = import.meta.env.DEV && active?.kind === 'text'
  const frameRef = useRef(null)
  const busyRef = useRef(false)
  const requestFrameRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const updateItems = useCallback(nextItems => {
    setItems(nextItems)
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(nextItems.map(item => ({
        id: item.id,
        ...Object.fromEntries(LAYOUT_FIELDS.map(field => [field, item[field]])),
      }))))
    } catch {
      // Editing still works when browser storage is unavailable.
    }
  }, [])

  onCompleteRef.current = onComplete

  const revealStep = index => {
    if (busyRef.current || index >= SEQUENCE.length) return
    busyRef.current = true
    setActiveFadeIndex(index)
    requestFrameRef.current = window.requestAnimationFrame(() => {
      setVisibleThrough(index)
    })
  }

  useEffect(() => {
    revealStep(0)
    return () => {
      if (requestFrameRef.current !== null) window.cancelAnimationFrame(requestFrameRef.current)
      busyRef.current = false
    }
  }, [])

  useEffect(() => {
    const nextIndex = AUTO_FOLLOW_STEPS[completedIndex]
    if (nextIndex === undefined || isImageEditorOpen) return undefined
    const timer = window.setTimeout(() => {
      busyRef.current = false
      revealStep(nextIndex)
    }, AUTO_FOLLOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [completedIndex, isImageEditorOpen])

  useEffect(() => {
    if (!(isImageEditorOpen || isTextEditorOpen) || activeFadeIndex === null) return
    if (requestFrameRef.current !== null) window.cancelAnimationFrame(requestFrameRef.current)
    busyRef.current = false
    setVisibleThrough(activeFadeIndex)
    setCompletedIndex(activeFadeIndex)
    setActiveFadeIndex(null)
  }, [activeFadeIndex, isImageEditorOpen, isTextEditorOpen])

  const handleFadeComplete = event => {
    if (event.propertyName !== 'opacity') return
    const itemId = event.target.dataset.sequenceItemId
    if (!itemId || itemId !== SEQUENCE[activeFadeIndex]) return
    if (AUTO_FOLLOW_STEPS[activeFadeIndex] === undefined) busyRef.current = false
    setCompletedIndex(activeFadeIndex)
    setActiveFadeIndex(null)
  }

  const handleStageClick = event => {
    if (isImageEditorOpen || isTextEditorOpen || busyRef.current) return
    if (event.target.closest('.layout-editor-panel, .dev-editor-launcher')) return
    if (visibleThrough === SEQUENCE.length - 1) {
      busyRef.current = true
      onCompleteRef.current?.()
      return
    }
    if (completedIndex < 0) return
    revealStep(completedIndex + 1)
  }

  const visibleItems = items.map(item => {
    const sequenceIndex = SEQUENCE.indexOf(item.id)
    const isSequenceVisible = sequenceIndex <= visibleThrough
    const isFading = sequenceIndex === activeFadeIndex
    const editorOverride = isImageEditorOpen || (isTextEditorOpen && Boolean(item.groupId))
    return {
      ...item,
      opacity: editorOverride || isSequenceVisible ? 1 : 0,
      sequenceFading: isFading && !editorOverride,
    }
  })

  return (
    <main className="t-comic-page" aria-label="Telescope comic transition" aria-busy={activeFadeIndex !== null} data-reading-step={completedIndex} tabIndex={0} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();handleStageClick(event)}if(event.key==='Escape')onBack?.()}} onClick={handleStageClick} onTransitionEnd={handleFadeComplete} style={{ '--t-comic-fade-duration': `${FADE_DURATION_MS}ms` }}>
      <EditionComicControls
        onBack={onBack}
        onStart={onComplete}
        startLabel="開始觀測"
        title={<div className="t-comic-title"><h1>望遠鏡的故事</h1><p lang="en">The Story of the Telescope</p></div>}
      />
      <div className="edition-comic-frame-heading" aria-hidden="true" />
      <div className="portal-comic__panels edition-comic-frame t-comic-frame">
        <div ref={frameRef} className="t-comic-fit">
        <LayoutEditor
          items={visibleItems}
          initialItems={initialItems}
          onChange={updateItems}
          layoutId="t-comic"
          stage={{ width: 1920, height: 1080 }}
          stageBoundsRef={frameRef}
          renderGroupContent={item => {
            if (!item.groupId) return null
            const number = Number(item.id.replace('t-dialog-', ''))
            return <DialogueText key={`t-dialog-text-${number}`} number={number} />
          }}
        />
        </div>
      </div>
      <button
        className={`portal-comic__continue edition-comic-frame-footer${canContinue ? ' is-visible' : ''}`}
        onClick={onComplete}
        onPointerDown={event => event.stopPropagation()}
        disabled={!canContinue}
        aria-hidden={!canContinue}
        tabIndex={canContinue ? 0 : -1}
      ><ContinueText /></button>
    </main>
  )
}

export default TComicPage
