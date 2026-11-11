import { PIGMENTS } from '../../edition/palette'
import { MOTION } from '../bigTest/config'
export const THEME = { cream:PIGMENTS.paper, panel:PIGMENTS.white, white:PIGMENTS.white, ink:PIGMENTS.ink, teal:PIGMENTS.mint, yellow:PIGMENTS.butter, blue:PIGMENTS.sky, pink:PIGMENTS.strawberry, mint:PIGMENTS.mint, peach:PIGMENTS.peach, motion: MOTION }
export const SELECTOR = { visibleCount: 3, gap: 8, expandedRatio: .66, duration: MOTION.duration / 1000, easing: [.22, .75, .25, 1] }
export const CHARACTERS = [
  { id: 'lar', name: '拉爾', side: 'right', defaultBody: '叉腰.PNG', defaultFace: 1,
    framing: { width: 1288, height: 2102, transform: 'translate(-670 -280) scale(1) rotate(2.5 1252.5 1200)', outlineRadius: 22 } },
  { id: 'tivbo', name: '緹芙波', side: 'left', defaultBody: '叉腰舉手.PNG', defaultFace: 4,
    framing: { width: 1291, height: 2138, transform: 'translate(-475 -285) scale(0.92) rotate(-2 1152.5 1200)', outlineRadius: 18 } },
]
// All works are fictional placeholders; replace covers with your own image paths.
export const CATEGORIES = [
  { id: 'games', name: '遊戲', works: ['lantern-quest', 'tiny-orbits', 'garden-loop'] },
  { id: 'movies', name: '電影', works: ['paper-moon', 'last-train', 'summer-window'] },
  { id: 'animation', name: '動畫', works: ['cloud-post', 'little-comet', 'blue-kite'] },
  { id: 'tv', name: '影集', works: ['room-seven', 'quiet-street', 'weekend-club'] },
  { id: 'musicals', name: '音樂劇', works: ['midnight-stage', 'city-chorus', 'turn-the-page'] },
]
const titles = ['Lantern Quest', 'Tiny Orbits', 'Garden Loop', 'Paper Moon', 'The Last Train', 'Summer Window', 'Cloud Post', 'Little Comet', 'The Blue Kite', 'Room Seven', 'Quiet Street', 'Weekend Club', 'Midnight Stage', 'City Chorus', 'Turn the Page']
export const WORKS = Object.fromEntries(CATEGORIES.flatMap((category, group) => category.works.map((id, index) => [id, {
  id, name: titles[group * 3 + index], originalTitle: titles[group * 3 + index], category: category.id, cover: null, color: [THEME.pink, THEME.blue, THEME.yellow][index], pattern: ['circle', 'stripes', 'grid'][index],
  summary: 'A small discovery from our shared shelf of favorites.',
  description: ['This fictional work is a placeholder for a future student recommendation. Its cover, description, and conversation can all be replaced in the data file.', 'We collect works that make us curious, make us laugh, or give us something to discuss on the way back to the laboratory.'],
  recommendation: 'Best enjoyed with a friend who asks completely different questions.', illustration: null,
  dialogue: [
    { speaker: 'lar', text: `I saved a place for ${titles[group * 3 + index]} on our favorites shelf.`, expression: 'happy', motion: 'greet' },
    { speaker: 'tivbo', text: 'Our shelf is getting bigger. Again.', expression: 'amused', motion: null },
    { speaker: 'lar', text: 'That just means we need a longer afternoon!', expression: 'happy', motion: null },
  ],
}])) )
