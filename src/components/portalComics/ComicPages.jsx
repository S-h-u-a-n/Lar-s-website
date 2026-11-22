import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Text from '../main/Text'
import LayoutEditor from '../../dev/LayoutEditor'
import { useDevEditorState } from '../../dev/devEditorStore'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import { usePersistedEditableText } from '../../dev/useEditableText'
import { PORTAL_COMICS } from './config'
import BallComicPage from './BallComicPage'
import naturalLayout from './naturalComicLayout.json'
import humanLayout from './humanComicLayout.json'
import naturalTextConfig from './naturalComicTextConfig.json'
import humanTextConfig from './humanComicTextConfig.json'
import './ComicPages.css'
import './FieldComicPage.css'

const LAYOUT_FIELDS = ['x', 'y', 'width', 'rotation', 'zIndex']
const LAYOUT_DEFAULTS = {
  'book-open1': new Map(naturalLayout.map(item => [item.id, item])),
  'book-close1': new Map(humanLayout.map(item => [item.id, item])),
}
const LAYOUT_STORAGE_KEYS = {
  'book-open1': 'layout-editor:natural-comic:2026-11-22-v2',
  'book-close1': 'layout-editor:human-comic:2026-11-22-v2',
}
const STAGE = { width: 1920, height: 1080 }
const FIELD_COMIC_TEXT_CONFIGS = Object.fromEntries(
  [naturalTextConfig, humanTextConfig].map(config => [
    config.pageId,
    {
      revision: config.revision,
      dialogues: Object.fromEntries(Object.entries(config.registered).map(([id, values]) => {
        const { coordinateSpace, ...defaultValues } = values
        return [id, {
          coordinateSpace,
          defaultValues,
          sourceDefaultKeys: Object.keys(defaultValues).filter(key =>
            !['width', 'maxWidth', 'height', 'maxHeight'].includes(key)
            || defaultValues[key] !== null,
          ),
        }]
      })),
    },
  ]),
)

function migrateFieldComicTextStorage(pageId) {
  const config = FIELD_COMIC_TEXT_CONFIGS[pageId]
  if (!config) return
  const storageKey = `genesis:text-editor:${pageId}:v1`
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Unknown text config format')
    let changed = false
    const migrated = { ...saved }
    Object.entries(config.dialogues).forEach(([id, dialogue]) => {
      const entry = saved[id]
      if (!entry?.defaults || !entry?.values || entry.sourceRevision === config.revision) return
      const values = { ...dialogue.defaultValues }
      Object.keys(dialogue.defaultValues).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(entry.values, key) && entry.defaults[key] !== entry.values[key]) {
          values[key] = entry.values[key]
        }
      })
      migrated[id] = {
        ...entry,
        coordinateSpace: dialogue.coordinateSpace,
        sourceRevision: config.revision,
        sourceRevisionStrategy: 'preserve-edits',
        sourceDefaultKeys: dialogue.sourceDefaultKeys,
        defaults: { ...dialogue.defaultValues },
        values,
      }
      changed = true
    })
    if (changed) localStorage.setItem(storageKey, JSON.stringify(migrated))
  } catch (error) {
    console.warn(`[ComicPage] Could not migrate text settings ${pageId}`, error)
  }
}

function loadStoryLayout(portalId, items) {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEYS[portalId]) || 'null')
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

function FieldComicDialogue({ id, label, pageId }) {
  const config = FIELD_COMIC_TEXT_CONFIGS[pageId]
  const dialogue = config.dialogues[id]
  const editable = usePersistedEditableText({
    id,
    label,
    coordinateSpace: dialogue.coordinateSpace,
    defaultValues: dialogue.defaultValues,
    sourceRevision: config.revision,
    sourceRevisionStrategy: 'preserve-edits',
    sourceDefaultKeys: dialogue.sourceDefaultKeys,
  })
  return <p id={id} ref={editable.ref} {...editable.props} className="field-comic-dialogue">
    {editable.text ?? editable.defaultText ?? dialogue.defaultValues.text}
  </p>
}

function ComicPage({ portalId, onContinue, onBack }) {
  const data = PORTAL_COMICS[portalId]
  const prefix = `${data.screen}-`
  const story = data.story
  const sequence = story?.artwork.map(item => item.id) ?? []
  const [initialItems] = useState(() => story
    ? story.artwork.map(item => ({ ...item, ...LAYOUT_DEFAULTS[portalId].get(item.id) }))
    : [])
  const [items, setItems] = useState(() => loadStoryLayout(portalId, initialItems))
  const [visibleThrough, setVisibleThrough] = useState(-1)
  const [activeFadeIndex, setActiveFadeIndex] = useState(null)
  const [completedIndex, setCompletedIndex] = useState(-1)
  const frameRef = useRef(null)
  const busyRef = useRef(false)
  const requestFrameRef = useRef(null)
  const onContinueRef = useRef(onContinue)
  const { active } = useDevEditorState()
  const isItemEditorOpen = import.meta.env.DEV && (active?.kind === 'img' || active?.kind === 'text')

  useLayoutEffect(() => {
    migrateFieldComicTextStorage(data.screen)
    return enablePageTextPersistence(data.screen, prefix)
  }, [data.screen, prefix])
  onContinueRef.current = onContinue

  const updateItems = useCallback(nextItems => {
    setItems(nextItems)
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEYS[portalId], JSON.stringify(nextItems.map(item => ({
        id: item.id,
        ...Object.fromEntries(LAYOUT_FIELDS.map(field => [field, item[field]])),
      }))))
    } catch {
      // The current layout remains usable if browser storage is unavailable.
    }
  }, [portalId])

  const revealStep = index => {
    if (busyRef.current || index >= sequence.length) return
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
    if (!story) return undefined
    revealStep(0)
    return () => {
      if (requestFrameRef.current !== null) window.cancelAnimationFrame(requestFrameRef.current)
      busyRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isItemEditorOpen || activeFadeIndex === null) return
    if (requestFrameRef.current !== null) window.cancelAnimationFrame(requestFrameRef.current)
    busyRef.current = false
    setVisibleThrough(activeFadeIndex)
    setCompletedIndex(activeFadeIndex)
    setActiveFadeIndex(null)
  }, [activeFadeIndex, isItemEditorOpen])

  const handleFadeComplete = event => {
    if (event.propertyName !== 'opacity' || activeFadeIndex === null) return
    if (event.target.dataset.sequenceItemId !== sequence[activeFadeIndex]) return
    setCompletedIndex(activeFadeIndex)
    setActiveFadeIndex(null)
    busyRef.current = false
  }

  const handleStageClick = event => {
    if (!story || isItemEditorOpen || busyRef.current || event.target.closest('.layout-editor-panel, .dev-editor-launcher, button')) return
    if (completedIndex === sequence.length - 1) {
      onContinueRef.current?.()
      return
    }
    if (completedIndex < 0) return
    revealStep(completedIndex + 1)
  }

  const visibleItems = items.map(item => {
    const sequenceIndex = sequence.indexOf(item.id)
    return {
      ...item,
      opacity: isItemEditorOpen || sequenceIndex <= visibleThrough ? 1 : 0,
      sequenceFading: sequenceIndex === activeFadeIndex && !isItemEditorOpen,
    }
  })

  if (story) {
    const canContinue = completedIndex === sequence.length - 1 && activeFadeIndex === null
    return <main
      className="portal-comic field-comic-page"
      aria-label={`${data.title} comic introduction`}
      aria-busy={activeFadeIndex !== null}
      data-reading-step={completedIndex}
      tabIndex={0}
      onClick={handleStageClick}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleStageClick(event)
        }
        if (event.key === 'Escape') onBack?.()
      }}
      onTransitionEnd={handleFadeComplete}
      style={{ '--field-comic-fade-duration': '560ms' }}
    >
      <header>
        <button type="button" onClick={onBack}><Text id={`${prefix}back`}>BACK</Text></button>
        <Text as="h1" id={`${prefix}title`}>{data.title}</Text>
        <span aria-hidden="true" />
      </header>
      <section ref={frameRef} className="portal-comic__panels field-comic-frame" aria-label="Comic artwork">
        <div className="field-comic-fit">
          <LayoutEditor
            pageId={data.screen}
            items={visibleItems}
            initialItems={initialItems}
            onChange={updateItems}
            layoutId={data.screen}
            draftKey={LAYOUT_STORAGE_KEYS[portalId].replace('layout-editor:', '')}
            stage={STAGE}
            fitContent={false}
            stageBoundsRef={frameRef}
            renderGroupContent={item => {
              const dialogueIndex = story.artwork.findIndex(artwork => artwork.id === item.id) - 1
              if (dialogueIndex < 0) return null
              const number = dialogueIndex + 1
              return <FieldComicDialogue
                id={`${data.screen}-dialogue-${number}`}
                label={`${data.title} / Dialog ${number}`}
                pageId={data.screen}
              />
            }}
          />
        </div>
      </section>
      <button
        type="button"
        className={`portal-comic__continue${canContinue ? ' is-visible' : ''}`}
        onClick={onContinue}
        onPointerDown={event => event.stopPropagation()}
        disabled={!canContinue}
        aria-hidden={!canContinue}
        tabIndex={canContinue ? 0 : -1}
      ><Text id={`${prefix}continue`}>CONTINUE</Text></button>
    </main>
  }

  return <main className="portal-comic" aria-label={`${data.title} comic introduction`}>
    <header><button onClick={onBack}><Text id={`${prefix}back`}>BACK</Text></button><Text as="h1" id={`${prefix}title`}>{data.title}</Text></header>
    <section className="portal-comic__panels" aria-label="Comic content">
      {data.panels.length ? data.panels.map(panel => <img key={panel.id} src={panel.src} alt={panel.alt || ''} />) : <Text id={`${prefix}placeholder`}>COMIC COMING SOON</Text>}
    </section>
    <button className="portal-comic__continue" onClick={onContinue}><Text id={`${prefix}continue`}>CONTINUE</Text></button>
  </main>
}
export function GlobeComicPage(props) { return <ComicPage portalId="globe" {...props} /> }
export function NaturalComicPage(props) { return <ComicPage portalId="book-open1" {...props} /> }
export function HumanComicPage(props) { return <ComicPage portalId="book-close1" {...props} /> }
export { BallComicPage }
export const COMIC_PAGES = { 'globe-comic': GlobeComicPage, 'natural-comic': NaturalComicPage, 'human-comic': HumanComicPage, 'ball-comic': BallComicPage }

// Commit only after the lazy destination resolves. Match Main's existing arrival stage.
export function PortalPageArrival({ children, onReady, onMounted, animate }) {
  useLayoutEffect(() => { onMounted?.() }, [onMounted])
  useEffect(() => {
    if (!animate || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const frame = requestAnimationFrame(() => onReady?.())
    return () => cancelAnimationFrame(frame)
  }, [animate, onReady])
  return <div className={animate ? "portal-page-arrival" : undefined} onAnimationEnd={event => {
    if (event.target === event.currentTarget && event.animationName === 'home-page-arrive') onReady()
  }}>{children}</div>
}
