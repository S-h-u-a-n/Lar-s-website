import { CONTINENTS } from './celestialData'
import { PALETTE } from './config'
export const CHARACTERS = { mira: { name: 'Mira', initials: 'M', color: PALETTE.pink, avatar: null }, theo: { name: 'Theo', initials: 'T', color: PALETTE.blue, avatar: null } }
const chapter = (group, number, title) => ({ id: `${group}-${number}`, title, background: null, dialogue: [
  { id: 'question', character: 'mira', text: 'What should we look for first? There is so much left to discover.' },
  { id: 'answer', character: 'theo', text: 'Let us begin with one question, and leave room in the notebook for a surprise.' },
  { id: 'promise', character: 'mira', text: 'Then this is our first observation: we will explore together.' },
] })
export const STORY_GROUPS = Object.fromEntries([...CONTINENTS.map(c => [c.id, [chapter(c.id,1,`A Question in ${c.name}`), chapter(c.id,2,'The Next Observation')]]), ['celestial',[chapter('celestial',1,'A Conversation under the Stars'),chapter('celestial',2,'One More Question')]]])
export const ALL_CHAPTERS = Object.values(STORY_GROUPS).flat()
