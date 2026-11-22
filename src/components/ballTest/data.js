import { PIGMENTS } from '../../edition/palette'
import { MOTION } from '../bigTest/config'
import posterSources from './posterSources.json'
import characterManifest from '../../../Art/ball/web/characters.json'
import { buildDialogueCatalog } from './dialogueMarkdown'
const workMarkdownFiles = import.meta.glob('/content/ball/*.md', { eager: true, query: '?raw', import: 'default' })
export const WORK_MARKDOWN = Object.fromEntries(Object.entries(workMarkdownFiles).map(([path, markdown]) => {
  const id = path.match(/\/([^/]+)\.md$/)?.[1]
  if (!id) throw new Error(`Invalid Ball work Markdown path: ${path}`)
  return [id, markdown]
}))
export const THEME = { cream:PIGMENTS.paper, panel:PIGMENTS.white, white:PIGMENTS.white, ink:PIGMENTS.ink, teal:PIGMENTS.mint, yellow:PIGMENTS.butter, blue:PIGMENTS.sky, pink:PIGMENTS.strawberry, mint:PIGMENTS.mint, peach:PIGMENTS.peach, motion: MOTION }
export const SELECTOR = { visibleCount: 3, gap: 8, expandedRatio: .66, duration: .36, easing: [.22, .75, .25, 1] }
export const CHARACTERS = [
  { id: 'lar', name: '拉爾', side: 'right', defaultBody: '叉腰.PNG', defaultFace: 1,
    framing: { width: 1288, height: 2102, transform: 'translate(-670 -280) scale(1) rotate(2.5 1252.5 1200)', outlineRadius: 22 } },
  { id: 'tivbo', name: '緹芙波', side: 'left', defaultBody: 6, defaultFace: 2,
    framing: { width: 1291, height: 2138, transform: 'translate(-475 -285) scale(0.92) rotate(-2 1152.5 1200)', outlineRadius: 18 } },
]
// Keep category order and music unchanged; selected posters load from local public assets.
export const CATEGORIES = [
  { id: 'movies', name: '電影', works: ['the-big-short', 'the-parent-trap', 'deadpool'] },
  { id: 'games', name: '遊戲', works: ['persona-3-reload', 'raging-loop', 'fate-grand-order'] },
  { id: 'anime', name: '動漫', works: ['hunter-x-hunter', 'witch-watch', 'monthly-girls-nozaki-kun'] },
  { id: 'novels', name: '文學', works: ['old-poverty-chronicles', 'okay-for-now', 'all-tomorrows'] },
  { id: 'performing-arts', name: '表演藝術', works: ['hamilton', 'come-from-away', 'next-to-normal'] },
  // Matching WORKS entries use the existing poster/cover fields plus artist, releaseYear, markdown, and optional spotifyEmbedUrl.
  { id: 'music', name: '音樂', works: ['tattoo', 'sayonara-mata-itsuka', 'naizou-arimasuka', 'rubia', 'haru-wa-tokete', 'yuureigai-to-gyakusetsu'] },
]
const MUSIC_WORKS = [
  { id: 'tattoo', name: 'TATTOO', artist: 'Official髭男dism', spotifyEmbedUrl: 'https://open.spotify.com/track/13ZIDAvNsxw1vL7p24Qc7Z' },
  { id: 'sayonara-mata-itsuka', name: 'さよーならまたいつか！', artist: '米津玄師', spotifyEmbedUrl: 'https://open.spotify.com/track/6jRyCWUAnRVir3OK4jSZvV' },
  { id: 'naizou-arimasuka', name: '内臓ありますか', artist: '初音ミク', spotifyEmbedUrl: 'https://open.spotify.com/track/3eN2ASIcZM0Xf6cxUH9pCa' },
  { id: 'rubia', name: 'Rubia', artist: '周深', spotifyEmbedUrl: 'https://open.spotify.com/track/1cyGvXPHdd5yG0Hrf9Ms8x' },
  { id: 'haru-wa-tokete', name: '春は溶けて', artist: 'indigo la End', spotifyEmbedUrl: 'https://open.spotify.com/track/0BjlWBXUDhFqS32la5kDPL' },
  { id: 'yuureigai-to-gyakusetsu', name: '幽霊街と逆説', artist: 'Hello Sleepwalkers', spotifyEmbedUrl: 'https://open.spotify.com/track/1YOlCfQSUKMwBUkr9d0Pr7' },
].map((song, index) => [song.id, {
  ...song,
  originalTitle: song.name,
  category: 'music',
  cover: null,
  posterPreview: null,
  posterDetail: null,
  markdown: song.id,
  // Same indexed color rotation as the other shelves; sampled from square 2/8/12/13/3/7.
  color: ['#FFD6C6', '#FFE4C5', '#FBF4EB', '#C6D483', '#EAEB8E', '#FFB5AB'][index % 6],
  pattern: ['circle', 'stripes', 'grid'][index % 3],
  summary: '',
  description: [],
  recommendation: '',
  illustration: null,
}])
const ORIGINAL_TITLES = {
  'witch-watch': 'ウィッチウォッチ',
  'raging-loop': 'レイジングループ',
}
const newWorks = Object.values(posterSources)
  .filter(source => !['deadpool', 'persona-3-reload'].includes(source.id))
  .map((source, index) => [source.id, {
    id: source.id, name: source.workTitle, originalTitle: ORIGINAL_TITLES[source.id] || source.workTitle, category: source.category,
    cover: null, posterPreview: null, posterDetail: null,
    color: [THEME.pink, THEME.blue, THEME.yellow][index % 3], pattern: ['circle', 'stripes', 'grid'][index % 3],
    summary: '', description: [], recommendation: '', illustration: null,
  }])
const workRecords = Object.fromEntries([
  ...newWorks,
  ...MUSIC_WORKS,
  ['persona-3-reload', {
    id: 'persona-3-reload',
    name: 'PERSONA 3 RELOAD',
    originalTitle: 'ペルソナ３ リロード',
    category: 'games',
    cover: null,
    posterPreview: null,
    posterDetail: null,
    posterPreviewTitle: 'PERSONA 3 RELOAD',
    markdown: 'persona3reload',
    color: THEME.blue,
    pattern: 'circle',
    summary: '',
    description: [],
    recommendation: '',
    illustration: null,
  }],
  ['deadpool', {
    id: 'deadpool',
    name: 'DEADPOOL',
    originalTitle: 'Deadpool',
    category: 'movies',
    cover: null,
    posterPreview: null,
    posterDetail: null,
    posterPreviewTitle: 'DEADPOOL',
    posterPreviewPosition: '50% 40%',
    posterHoverPosition: '50% 40%',
    markdown: 'deadpool',
    color: THEME.pink,
    pattern: 'circle',
    summary: '',
    description: [],
    recommendation: '',
    illustration: null,
  }],
])

// Existing work information and poster metadata remain separate from dialogue.
export const WORKS = Object.fromEntries(Object.entries(workRecords).map(([id, work]) => {
  const source = posterSources[id]
  return [id, source?.localPath ? {
    ...work,
    cover: source.localPath,
    posterPreview: source.localPath,
    posterDetail: source.localPath,
    posterPreviewTitle: null,
  } : work]
}))


const dialogueFiles = import.meta.glob('/content/ball/dialogue/*.md', { eager: true, query: '?raw', import: 'default' })
export const DIALOGUE_MARKDOWN = Object.fromEntries(Object.entries(dialogueFiles).map(([path,source]) => [path.split('/').at(-1),source]))
export const DIALOGUE_CATALOG = buildDialogueCatalog(DIALOGUE_MARKDOWN,CATEGORIES,WORKS,characterManifest.characters)
export const OPENING_DIALOGUE = DIALOGUE_CATALOG.opening
for (const [id,work] of Object.entries(WORKS)) work.dialogue = DIALOGUE_CATALOG.byWorkId[id]
if (DIALOGUE_CATALOG.diagnostics.length) console.warn('[Ball dialogue] Markdown authoring issues',DIALOGUE_CATALOG.diagnostics)
