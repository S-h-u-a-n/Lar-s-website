import { PIGMENTS } from '../../edition/palette'
import { MOTION } from '../bigTest/config'
import deadpoolPosterPreview from '../../../Art/ball/poster/DEADPOOL/notitle.jpg'
import deadpoolPosterDetail from '../../../Art/ball/poster/DEADPOOL/all.jpg'
import persona3ReloadPosterPreview from '../../../Art/ball/poster/persona3reload/notitle.jpg'
import persona3ReloadPosterDetail from '../../../Art/ball/poster/persona3reload/all.jpg'
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
  { id: 'tivbo', name: '緹芙波', side: 'left', defaultBody: '叉腰舉手.PNG', defaultFace: 4,
    framing: { width: 1291, height: 2138, transform: 'translate(-475 -285) scale(0.92) rotate(-2 1152.5 1200)', outlineRadius: 18 } },
]
// All works are fictional placeholders; replace covers with your own image paths.
export const CATEGORIES = [
  { id: 'movies', name: '電影', works: ['deadpool', 'paper-moon', 'last-train', 'summer-window'] },
  { id: 'games', name: '遊戲', works: ['lantern-quest', 'tiny-orbits', 'persona-3-reload', 'garden-loop'] },
  { id: 'anime', name: '動漫', works: ['cloud-post', 'little-comet', 'blue-kite'] },
  { id: 'novels', name: '小說', works: ['room-seven', 'quiet-street', 'weekend-club'] },
  { id: 'performing-arts', name: '表演藝術', works: ['midnight-stage', 'city-chorus', 'turn-the-page'] },
  // Matching WORKS entries use the existing poster/cover fields plus artist, releaseYear, markdown, and optional spotifyEmbedUrl.
  { id: 'music', name: '音樂', works: ['tattoo', 'sayonara-mata-itsuka', 'naizou-arimasuka', 'rubia', 'haru-wa-tokete', 'yuureigai-to-gyakusetsu'] },
]
const TITLES = {
  'lantern-quest': 'Lantern Quest',
  'tiny-orbits': 'Tiny Orbits',
  'garden-loop': 'Garden Loop',
  'paper-moon': 'Paper Moon',
  'last-train': 'The Last Train',
  'summer-window': 'Summer Window',
  'cloud-post': 'Cloud Post',
  'little-comet': 'Little Comet',
  'blue-kite': 'The Blue Kite',
  'room-seven': 'Room Seven',
  'quiet-street': 'Quiet Street',
  'weekend-club': 'Weekend Club',
  'midnight-stage': 'Midnight Stage',
  'city-chorus': 'City Chorus',
  'turn-the-page': 'Turn the Page',
}
const PLACEHOLDER_DIALOGUE = name => [
  { speaker: 'lar', text: `I saved a place for ${name} on our favorites shelf.`, expression: 'happy', motion: 'greet' },
  { speaker: 'tivbo', text: 'Our shelf is getting bigger. Again.', expression: 'amused', motion: null },
  { speaker: 'lar', text: 'That just means we need a longer afternoon!', expression: 'happy', motion: null },
]
const PLACEHOLDER_DESCRIPTION = [
  'This fictional work is a placeholder for a future student recommendation. Its cover, description, and conversation can all be replaced in the data file.',
  'We collect works that make us curious, make us laugh, or give us something to discuss on the way back to the laboratory.',
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
  dialogue: PLACEHOLDER_DIALOGUE(song.name),
}])
const placeholderWorks = CATEGORIES.flatMap(category => category.works
  .filter(id => !['deadpool', 'persona-3-reload'].includes(id))
  .map((id, index) => {
    const name = TITLES[id]
    return [id, {
      id, name, originalTitle: name, category: category.id, cover: null, posterPreview: null, posterDetail: null, color: [THEME.pink, THEME.blue, THEME.yellow][index % 3], pattern: ['circle', 'stripes', 'grid'][index % 3],
      summary: 'A small discovery from our shared shelf of favorites.',
      description: PLACEHOLDER_DESCRIPTION,
      recommendation: 'Best enjoyed with a friend who asks completely different questions.', illustration: null,
      dialogue: PLACEHOLDER_DIALOGUE(name),
    }]
  }))
export const WORKS = Object.fromEntries([
  ...placeholderWorks,
  ...MUSIC_WORKS,
  ['persona-3-reload', {
    id: 'persona-3-reload',
    name: 'PERSONA 3 RELOAD',
    originalTitle: '女神異聞錄3 Reload',
    category: 'games',
    cover: null,
    posterPreview: persona3ReloadPosterPreview,
    posterDetail: persona3ReloadPosterDetail,
    posterPreviewTitle: 'PERSONA 3 RELOAD',
    markdown: 'persona3reload',
    color: THEME.blue,
    pattern: 'circle',
    summary: '',
    description: [],
    recommendation: '',
    illustration: null,
    dialogue: PLACEHOLDER_DIALOGUE('PERSONA 3 RELOAD'),
  }],
  ['deadpool', {
    id: 'deadpool',
    name: 'DEADPOOL',
    originalTitle: 'Deadpool',
    category: 'movies',
    cover: null,
    posterPreview: deadpoolPosterPreview,
    posterDetail: deadpoolPosterDetail,
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
    dialogue: PLACEHOLDER_DIALOGUE('DEADPOOL'),
  }],
])
