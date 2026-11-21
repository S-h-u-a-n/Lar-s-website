import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './ComicIntro.css'
import { alignBookAnimation, BOOK_ANIMATION_ORIGIN } from './storybookBookLayout'
import { MOTION } from '../edition/config'
import LayoutEditor from '../dev/LayoutEditor'
import { useDevEditorState } from '../dev/devEditorStore'
import { usePersistedEditableText } from '../dev/useEditableText'
import { buildTextStyle, enablePageTextPersistence, selectText } from '../dev/textEditorStore'
import publishedTextConfigs from './storybookTextConfig.json'
import openbook from '../../Art/storybook/openbook.PNG'
import bookAnime from '../../Art/storybook/book-anime.PNG'
import storyHanging from '../../Art/storybook/story-hanging.PNG'
import storysquare1 from '../../Art/storybook/storysquare1.PNG'
import storysquare2 from '../../Art/storybook/storysquare2.PNG'
import storysquare3 from '../../Art/storybook/storysquare3.PNG'
import storysquare4 from '../../Art/storybook/storysquare4.PNG'
import storypage1Image1 from '../../Art/storybook/storypage1-1.PNG'
import storypage1Image2 from '../../Art/storybook/storypage1-2.PNG'
import storypage1Image3 from '../../Art/storybook/storypage1-3.PNG'
import storypage2Image1 from '../../Art/storybook/storypage2-1.PNG'
import storypage2Image2 from '../../Art/storybook/storypage2-2.PNG'
import storypage2Image3 from '../../Art/storybook/storypage2-3.PNG'
import storypage3Image1 from '../../Art/storybook/storypage3-1.PNG'
import storypage3Image2 from '../../Art/storybook/storypage3-2.PNG'
import storypage3Image3 from '../../Art/storybook/storypage3-3.PNG'
import storypage4Image1 from '../../Art/storybook/storypage4-1.PNG'

const STORYBOOK_STAGE = { width: 1920, height: 1080, className: 'story-stage' }
const STORY_PAGE_COUNTS = [3, 3, 3, 1]
const STORY_REVEAL_INTERVAL = MOTION.storyLayerMs
const STORY_ENTRANCE_ITEMS = ['story-hanging', 'storysquare1', 'storysquare2', 'storysquare3', 'storysquare4', 'openbook']
const BOOK_ANIMATION_DURATION = 1480
const STORY_TEXT_CONFIG = {
  text: '在前段時間⋯拉爾和緹芙波兩個魔法師被要求製作一個小論文，主題不限。',
  x: 6,
  y: 50,
  width: null,
  maxWidth: null,
  height: null,
  maxHeight: null,
  fontSize: 25,
  fontFamily: '"Chiron Sung", "Songti SC", serif',
  fontWeight: 700,
  lineHeight: 1.8,
  letterSpacing: 0,
  textAlign: 'center',
  writingMode: 'horizontal-tb',
  rotation: 0,
  zIndex: 130,
  opacity: 1,
  color: '#56525a',
}
const STORY_TEXT_DEFAULTS = Object.fromEntries(Object.entries(STORY_TEXT_CONFIG).filter(([, value]) => value !== null))
const STORY_TEXT_STYLE = buildTextStyle({
  type: 'registered',
  defaults: STORY_TEXT_CONFIG,
  values: STORY_TEXT_CONFIG,
  sourceDefaultKeys: Object.keys(STORY_TEXT_DEFAULTS),
})
const STORY_NARRATION = [
  [
    '在前段時間⋯拉爾和緹芙波兩個魔法師被要求製作一個小論文，主題不限。',
    '要做什麼好呢⋯在思考了很久後，終於有了一個好點子！',
    '「我們製作一個沒有魔法的世界吧！」',
    '對呀！沒有魔法的世界的人類要怎麼活著呢？會有什麼不一樣呢？',
  ],
  [
    '沒想到，這份原本只存在於紙上的小論文，意外地受到了校長與老師們的喜愛。',
    '然後……他們得到了一個意料之外的要求——',
    '「既然如此，不如真的做出來吧！」',
  ],
  [
    '於是，硬著頭皮上的拉爾和緹芙波只能四處找人幫忙。',
    '在大家的幫助下，終於有了世界的雛形！',
  ],
  [
    '接下來就是取名，要為世界取一個什麼樣的名字呢？',
    '「我們的世界叫天球，與之相對的⋯」',
    '「這個世界就叫『地球』吧！」',
    '於是，「我們」所生活的地球就誕生了——————',
  ],
]

function migrateStorybookDraft(savedItems) {
  let changed = false
  const migratedItems = savedItems.map(item => {
    if (item.id !== 'book-anime' || item.x !== 25 || item.y !== 55 || item.width !== 50 || item.rotation !== 0 || item.zIndex !== 2) return item
    changed = true
    return { ...item, x: 15.61, y: 41.09, width: 69.48 }
  })
  return changed ? migratedItems : savedItems
}

function createStorybookItems() {
  const composition = [
    { id: 'storysquare1', src: storysquare1, ratio: 3007 / 1015, x: 12.87, y: 20.45, width: 70.5, rotation: -0.06, zIndex: 1 },
    { id: 'storysquare2', src: storysquare2, ratio: 3120 / 1052, x: 16.14, y: 25.14, width: 61.59, rotation: 0, zIndex: 2 },
    { id: 'storysquare3', src: storysquare3, ratio: 2341 / 1279, x: 25.14, y: 21, width: 49.88, rotation: 0, zIndex: 3 },
    { id: 'storysquare4', src: storysquare4, ratio: 2639 / 1236, x: 18.82, y: 22.33, width: 61.35, rotation: 0, zIndex: 4 },
    { id: 'story-hanging', src: storyHanging, ratio: 4486 / 958, x: 0, y: 0, width: 100, rotation: 0, zIndex: 5, coordinateSpace: 'viewport', isNode: true },
    { id: 'openbook', src: openbook, ratio: 3815 / 1122, x: 15.42, y: 61.87, width: 69.8, rotation: 0, zIndex: 1 },
    { id: 'book-anime', src: bookAnime, ratio: 3798 / 1795, x: 15.61, y: 41.09, width: 69.48, rotation: 0, zIndex: 2, opacity: 0.5 },
    { id: 'storypage1-1', src: storypage1Image1, ratio: 2658 / 1750, x: 24.1, y: 20.84, width: 52.31, rotation: 0, zIndex: 6 },
    { id: 'storypage1-2', src: storypage1Image2, ratio: 1904 / 1641, x: 34.75, y: 33.48, width: 33.09, rotation: 0, zIndex: 7 },
    { id: 'storypage1-3', src: storypage1Image3, ratio: 1965 / 807, x: 31.01, y: 58.6, width: 36.61, rotation: 0, zIndex: 8 },
    { id: 'storypage2-1', src: storypage2Image1, ratio: 1291 / 1239, x: 22.27, y: 42.3, width: 24.83, rotation: 0, zIndex: 6 },
    { id: 'storypage2-2', src: storypage2Image2, ratio: 1792 / 1533, x: 31.89, y: 21.41, width: 29.76, rotation: 0, zIndex: 7 },
    { id: 'storypage2-3', src: storypage2Image3, ratio: 1481 / 1405, x: 56.09, y: 37.85, width: 26.42, rotation: 0, zIndex: 8 },
    { id: 'storypage3-1', src: storypage3Image1, ratio: 1305 / 2065, x: 39.34, y: 21.86, width: 23.62, rotation: 0, zIndex: 6 },
    { id: 'storypage3-2', src: storypage3Image2, ratio: 1332 / 1763, x: 57.13, y: 24.37, width: 23.17, rotation: 0, zIndex: 7 },
    { id: 'storypage3-3', src: storypage3Image3, ratio: 1250 / 1681, x: 21.81, y: 26.27, width: 23.71, rotation: 0, zIndex: 8 },
    { id: 'storypage4-1', src: storypage4Image1, ratio: 1421 / 1902, x: 38.88, y: 27.89, width: 24.05, rotation: 0, zIndex: 9 },
  ]
  // One shared affine layout keeps the book, page layers and square groups aligned.
  // Saved editor coordinates retain precedence; IDs and the storage key stay unchanged.
  return composition.map(item => item.id === 'story-hanging' ? item : {
    ...item, x: item.x * 0.9 + 20, width: item.width * 0.9,
  })
}

function PublishedStoryLabel({ sourceTextId, config }) {
  const defaults = useMemo(() => Object.fromEntries(Object.entries(config)
    .filter(([key, value]) => value !== null && !['selector', 'coordinateSpace'].includes(key))), [config])
  const editable = usePersistedEditableText({ id: `story-published-20261025-label-${sourceTextId}`,
    label: `Storybook / Page label / ${sourceTextId}`, defaultValues: defaults })
  const style = buildTextStyle({ type: 'registered', defaults, values: defaults, sourceDefaultKeys: Object.keys(defaults) })
  return <span ref={editable.ref} {...editable.props} style={{ ...style, ...editable.props.style, whiteSpace: 'pre-wrap' }}>{editable.text ?? defaults.text}</span>
}

function ComicIntro({ onContinue, onReady }) {
  const storyHangingRef = useRef(null)
  const clickLockedRef = useRef(true)
  const bookBlobRef = useRef(null)
  const bookTimerRef = useRef(null)
  const { active } = useDevEditorState()
  useEffect(() => {
    if (!import.meta.env.DEV) return enablePageTextPersistence('comic', 'story', { readOnly: true })
  }, [])
  const [visibleStoryPage, setVisibleStoryPage] = useState(1)
  const [phase, setPhase] = useState('loading')
  // Optional entry handoff; standalone/story navigation keeps its original flow.
  useEffect(() => {
    if (phase === 'entering' || phase === 'error') onReady?.()
  }, [phase, onReady])
  const [revealedCount, setRevealedCount] = useState(0)
  const [entranceRevealedCount, setEntranceRevealedCount] = useState(0)
  const [narrationIndex, setNarrationIndex] = useState(0)
  const sourceTextId = visibleStoryPage === 1 && narrationIndex === 0
    ? 'story-text' : `story-text-page-${visibleStoryPage}-sentence-${narrationIndex + 1}`
  const publishedSnapshot = publishedTextConfigs.find(config => config.registered[sourceTextId])
  // Versioned runtime IDs preserve old browser drafts without letting them
  // override this published revision. Future edits use the existing store.
  const storyTextId = `story-published-20261025-${sourceTextId}`
  const sentenceDefaults = useMemo(() => Object.fromEntries(Object.entries(
    publishedSnapshot.registered[sourceTextId],
  ).filter(([, value]) => value !== null)), [publishedSnapshot, sourceTextId])
  const sentenceStyle = buildTextStyle({ type: 'registered', defaults: sentenceDefaults,
    values: sentenceDefaults, sourceDefaultKeys: Object.keys(sentenceDefaults) })
  const labelConfig = Object.entries(publishedSnapshot.registered).find(([id]) => id.startsWith('codex-comic-dom-'))[1]
  const storyText = usePersistedEditableText({
    id: storyTextId,
    label: `Storybook / Page ${visibleStoryPage} / Sentence ${narrationIndex + 1}`,
    defaultValues: sentenceDefaults,
  })
  useEffect(() => {
    if (import.meta.env.DEV && active?.kind === 'text') selectText(storyTextId)
  }, [storyTextId, active?.kind])
  const [bookPlaybackUrl, setBookPlaybackUrl] = useState(null)
  const [textScale, setTextScale] = useState(() => Math.min(window.innerWidth / STORYBOOK_STAGE.width, window.innerHeight / STORYBOOK_STAGE.height))
  const [initialItems] = useState(createStorybookItems)
  const [items, setItems] = useState(initialItems)
  const updateItems = useCallback(nextItems => setItems(nextItems), [])

  useEffect(() => {
    const updateTextScale = () => setTextScale(Math.min(window.innerWidth / STORYBOOK_STAGE.width, window.innerHeight / STORYBOOK_STAGE.height))
    window.addEventListener('resize', updateTextScale)
    return () => window.removeEventListener('resize', updateTextScale)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    const illustrations = initialItems.filter(item => /^storypage/.test(item.id) || STORY_ENTRANCE_ITEMS.includes(item.id))
    const preload = illustrations.map(item => {
      const image = new Image()
      image.src = item.src
      return image.decode()
    })
    Promise.all([
      ...preload,
      fetch(bookAnime, { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error('Unable to load book animation')
        return response.blob()
      }).then(blob => { bookBlobRef.current = blob }),
    ]).then(() => {
      if (!cancelled) setPhase('entering')
    }).catch(() => {
      if (!cancelled) setPhase('error')
    })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [initialItems])

  useEffect(() => {
    if (phase === 'entering') {
      const groupRevealCounts = [1, 5, STORY_ENTRANCE_ITEMS.length]
      const timers = groupRevealCounts.map((count, index) => setTimeout(() => {
        setEntranceRevealedCount(count)
      }, 32 + index * STORY_REVEAL_INTERVAL))
      timers.push(setTimeout(() => setPhase('revealing'), groupRevealCounts.length * STORY_REVEAL_INTERVAL))
      return () => timers.forEach(clearTimeout)
    }
    if (phase === 'revealing') {
      const count = STORY_PAGE_COUNTS[visibleStoryPage - 1]
      const timers = Array.from({ length: count }, (_, index) => setTimeout(() => {
        setRevealedCount(index + 1)
      }, 32 + index * STORY_REVEAL_INTERVAL))
      return () => timers.forEach(clearTimeout)
    }
    if (phase === 'turning') {
      const url = URL.createObjectURL(bookBlobRef.current)
      setBookPlaybackUrl(url)
      return () => {
        clearTimeout(bookTimerRef.current)
        bookTimerRef.current = null
        URL.revokeObjectURL(url)
        setBookPlaybackUrl(null)
      }
    }
    return undefined
  }, [phase, visibleStoryPage])

  function handleIllustrationTransitionEnd(event) {
    const lastImageId = `storypage${visibleStoryPage}-${STORY_PAGE_COUNTS[visibleStoryPage - 1]}`
    if (event.propertyName !== 'opacity' || event.target.id !== lastImageId) return
    if (phase === 'revealing' && event.target.style.opacity === '1') {
      clickLockedRef.current = false
      setPhase(visibleStoryPage === 4 ? 'finished' : 'ready')
    } else if (phase === 'fading' && event.target.style.opacity === '0') {
      setPhase('turning')
    }
  }

  function handleNarrationTransitionEnd(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'opacity') return
    event.stopPropagation()
    if (phase === 'narration-out') {
      setNarrationIndex(index => index + 1)
      setPhase('narration-in')
    } else if (phase === 'narration-in') {
      clickLockedRef.current = false
      setPhase(visibleStoryPage === 4 ? 'finished' : 'ready')
    }
  }

  function handleBookLoad() {
    if (bookTimerRef.current !== null) return
    bookTimerRef.current = setTimeout(() => {
      setRevealedCount(0)
      setNarrationIndex(0)
      setVisibleStoryPage(page => page + 1)
      setPhase('revealing')
    }, BOOK_ANIMATION_DURATION)
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const image = storyHangingRef.current
    let frame = 0
    let resizeFrame = 0
    let startedAt = performance.now()
    let amplitude = 0

    const reset = () => {
      if (image) image.style.transform = 'skewX(0deg)'
    }
    const updateAmplitude = () => {
      const displayedHeight = image?.parentElement?.getBoundingClientRect().height ?? 0
      if (displayedHeight > 0) amplitude = Math.min(5.8, Math.atan(4 / displayedHeight) * 180 / Math.PI)
    }
    const render = now => {
      if (reducedMotion.matches || !image) return
      const elapsed = (now - startedAt) / 1000
      const angle = Math.sin((elapsed / 5.4) * Math.PI * 2 + 0.4) * amplitude
      image.style.transform = `skewX(${angle}deg)`
      frame = requestAnimationFrame(render)
    }
    const start = () => {
      cancelAnimationFrame(frame)
      if (reducedMotion.matches) {
        reset()
        return
      }
      updateAmplitude()
      startedAt = performance.now()
      frame = requestAnimationFrame(render)
    }
    const handleMotionPreference = () => start()
    const handleResize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(updateAmplitude)
    }

    reducedMotion.addEventListener('change', handleMotionPreference)
    window.addEventListener('resize', handleResize)
    start()
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(resizeFrame)
      reducedMotion.removeEventListener('change', handleMotionPreference)
      window.removeEventListener('resize', handleResize)
      reset()
    }
  }, [])

  const openbookLayout = items.find(item => item.id === 'openbook')
  const visibleItems = items.map(item => {
    const entranceIndex = STORY_ENTRANCE_ITEMS.indexOf(item.id)
    if (entranceIndex !== -1) return { ...item, opacity: entranceIndex < entranceRevealedCount ? 1 : 0 }
    const pageMatch = item.id.match(/^storypage(\d+)-(\d+)$/)
    if (pageMatch) return { ...item, opacity: visibleStoryPage === Number(pageMatch[1]) && Number(pageMatch[2]) <= revealedCount && phase !== 'fading' && phase !== 'turning' ? 1 : 0 }
    if (item.id === 'book-anime') return { ...alignBookAnimation(item, openbookLayout, STORYBOOK_STAGE), isNode: true }
    return item
  })
  const canSelectItem = item => {
    const pageMatch = item.id.match(/^storypage(\d+)-/)
    return !pageMatch || visibleStoryPage === Number(pageMatch[1])
  }
  const narration = STORY_NARRATION[visibleStoryPage - 1]
  const isLastSentence = narrationIndex === narration.length - 1
  const canAdvance = ['ready', 'finished'].includes(phase)
  const isNarrationVisible = revealedCount > 0 && ['revealing', 'ready', 'finished', 'narration-in'].includes(phase)

  function turnPage() {
    if (clickLockedRef.current || !canAdvance) return
    if (!isLastSentence) {
      clickLockedRef.current = true
      setPhase('narration-out')
      return
    }
    if (visibleStoryPage === 4) {
      clickLockedRef.current = true
      onContinue()
      return
    }
    clickLockedRef.current = true
    setPhase('fading')
  }

  function previewPage(page) {
    clickLockedRef.current = true
    setRevealedCount(0)
    setNarrationIndex(0)
    setVisibleStoryPage(page)
    setPhase('revealing')
  }

  function handlePageClick(event) {
    if (event.target.closest('.layout-editor-panel, .storybook-page-selector') || document.querySelector('.layout-editor-stage.is-open')) return
    turnPage()
  }

  function handleKeyDown(event) {
    if (active?.kind === 'text' || event.target.closest('input, textarea, [contenteditable="true"], .text-editor-panel')) return
    if (event.target.closest('.layout-editor-panel, .storybook-page-selector') || document.querySelector('.layout-editor-stage.is-open')) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      turnPage()
    }
  }

  return (
    <section
      className="comic-intro"
      style={{ '--book-animation-origin': BOOK_ANIMATION_ORIGIN }}
      aria-label="Storybook introduction"
      aria-disabled={!canAdvance || clickLockedRef.current}
      aria-busy={!['ready', 'finished', 'error'].includes(phase)}
      data-story-page={visibleStoryPage}
      data-story-phase={phase}
      data-story-revealed={revealedCount}
      data-story-entrance-revealed={entranceRevealedCount}
      data-story-sentence={narrationIndex + 1}
      role="button"
      tabIndex="0"
      onClick={handlePageClick}
      onKeyDown={handleKeyDown}
      onTransitionEnd={handleIllustrationTransitionEnd}
    >
      <div className="story-reference-circle" aria-hidden="true" style={{ "--story-scale": textScale }} />
      <LayoutEditor
        items={visibleItems}
        initialItems={initialItems}
        onChange={updateItems}
        layoutId="storybook-intro"
        draftKey="storybook-intro-layout-v5"
        stage={STORYBOOK_STAGE}
        migrateDraft={migrateStorybookDraft}
        canSelectItem={canSelectItem}
        renderNode={item => {
          if (item.id === 'story-hanging') return <img ref={storyHangingRef} className="story-hanging-image" src={item.src} style={{ opacity: item.opacity }} alt="" draggable="false" />
          if (item.id === 'book-anime' && phase === 'turning' && bookPlaybackUrl) return <img key={bookPlaybackUrl} className="story-book-animation" src={bookPlaybackUrl} onLoad={handleBookLoad} alt="" draggable="false" />
          return null
        }}
      />
      <div className="edition-story-page-label" aria-label={`故事第 ${visibleStoryPage} 頁，共 4 頁`}><PublishedStoryLabel key={sourceTextId} sourceTextId={sourceTextId} config={labelConfig} /><div>{[1,2,3,4].map(page=><i key={page} className={page===visibleStoryPage?'is-current':''}/>)}</div></div>
      <div id="story-text" ref={storyText.ref} {...storyText.props} style={{ "--story-scale": textScale, ...sentenceStyle, ...storyText.props.style, fontSize: `calc(${storyText.props.style?.fontSize ?? sentenceStyle.fontSize} * ${textScale})` }} className="story-narration" aria-live="polite" aria-atomic="true">
        <p
          className="story-narration-line"
          data-visible={isNarrationVisible}
          aria-hidden={!isNarrationVisible}
          onTransitionEnd={handleNarrationTransitionEnd}
          style={{ whiteSpace: 'pre-wrap' }}
        >{storyText.text ?? sentenceDefaults.text}</p>
      </div>
      {import.meta.env.DEV && active?.kind === 'img' && <div className="storybook-page-selector" role="group" aria-label="Storybook page visibility" onClick={event => event.stopPropagation()}>
        {[1, 2, 3, 4].map(page => <button key={page} type="button" aria-pressed={visibleStoryPage === page} disabled={!['ready', 'finished'].includes(phase)} onClick={() => previewPage(page)}>Page {page}</button>)}
      </div>}
    </section>
  )
}

export default ComicIntro
