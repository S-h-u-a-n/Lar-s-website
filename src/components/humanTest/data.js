import { STYLE } from '../naturalTest/data'
export { STYLE }
// Coordinates are local to each category. Add categories/entries without changing the camera.
export const CATEGORIES = [
  { id: 'history', name: 'HISTORY & CIVILIZATION', introduction: 'Time, settlements, and the ideas people carry forward.', x: 0, y: 0, width: 1100, height: 700, color: STYLE.yellow, decoration: 'architecture', landmark: '3000 BCE', entries: ['cities', 'timeline'] },
  { id: 'culture', name: 'CULTURE & ARTS', introduction: 'Many ways to tell a story. Many ways to listen.', x: 1500, y: -150, width: 1000, height: 700, color: STYLE.pink, decoration: 'pages', landmark: 'ACT I', entries: ['theatre', 'books'] },
  { id: 'society', name: 'SOCIETY & DAILY LIFE', introduction: 'A civilization is also a morning, a street, a shared meal.', x: 2900, y: 450, width: 1000, height: 750, color: STYLE.mint, decoration: 'city', landmark: '08:30', entries: ['commute', 'conversation'] },
  { id: 'technology', name: 'SCIENCE & TECHNOLOGY', introduction: 'Tools that carry messages without a single spell.', x: 400, y: 1150, width: 1100, height: 750, color: STYLE.blue, decoration: 'circuit', landmark: '0101', entries: ['printing', 'networks'] },
  { id: 'places', name: 'PLACES & PEOPLE', introduction: 'Find a place. Follow the lives that give it meaning.', x: 2150, y: 1500, width: 1100, height: 750, color: STYLE.teal, decoration: 'map', landmark: '51° N / 0° W', entries: ['bridges', 'library'] },
]
export const ENTRIES = [
  ['cities', 'history', 'FIRST CITIES', 'What changes when neighbors become a city?', 'article', 70, 300],
  ['timeline', 'history', 'A THREAD OF TIME', 'A small timeline of everyday inventions.', 'infographic', 560, 470],
  ['theatre', 'culture', 'THE OPEN STAGE', 'Stories shared in the same room.', 'article', 40, 310],
  ['books', 'culture', 'A BOOK TO BORROW', 'A student reading recommendation.', 'recommendation', 500, 450],
  ['commute', 'society', 'MORNING ROUTES', 'How a city wakes and moves.', 'article', 30, 300],
  ['conversation', 'society', 'NO SPELL REQUIRED', 'Two students discuss an ordinary train.', 'story', 510, 480],
  ['printing', 'technology', 'WORDS IN MULTIPLES', 'Printing and the journey of ideas.', 'article', 30, 310],
  ['networks', 'technology', 'CONNECTED VOICES', 'Messages that cross the planet.', 'article', 570, 490],
  ['bridges', 'places', 'MEETING IN THE MIDDLE', 'A bridge is more than a crossing.', 'article', 40, 310],
  ['library', 'places', 'THE PUBLIC LIBRARY', 'A place for borrowed knowledge.', 'article', 570, 500],
].map(([id, category, title, description, type, x, y]) => ({ id, category, title, description, type, x, y, content: id, detail: type.toUpperCase(), image: null }))
export const entryById = Object.fromEntries(ENTRIES.map(entry => [entry.id, entry]))
// Replace these short editorial placeholders with researched articles before publication.
export const CONTENT = Object.fromEntries(ENTRIES.map(entry => [entry.id, {
  title: entry.title, subtitle: entry.description, paragraphs: ['This field record is a starting point for a student investigation. Look closely at the objects, places, and habits people share.', 'Earth and our school world share the same natural geography. Here, we explore how communities developed tools and traditions without magic.'], note: 'A useful question for our next visit: which everyday skill would we need to learn before leaving our wands at home?', author: 'Mira · student researcher', image: null,
}]))
CONTENT.timeline.steps = [{ year: 'c. 3200 BCE', title: 'Writing', text: 'Marks preserve words beyond a conversation.' }, { year: 'c. 1450', title: 'Printing in Europe', text: 'Movable type helps reproduce pages in large numbers.' }, { year: '1830s', title: 'Railways expand', text: 'Schedules become part of everyday journeys.' }, { year: '1990s', title: 'The Web', text: 'Linked documents connect readers across distances.' }]
CONTENT.books.work = { name: 'Around the World in Eighty Days', kind: 'Novel · Jules Verne', description: 'A fictional journey shaped by transport, timetables, and unexpected company.', recommendation: 'Try reading with a map nearby. We kept pausing to ask how the travelers would solve each problem without a portal.' }
export const CHARACTERS = { mira: { name: 'Mira', initials: 'MI', color: STYLE.pink, avatar: null }, theo: { name: 'Theo', initials: 'TH', color: STYLE.blue, avatar: null } }
// Same chapter/dialogue shape as GlobeTest; Human content remains independent.
CONTENT.conversation.chapter = { id: 'ordinary-train', title: 'No Spell Required', background: null, dialogue: [
  { id: 'train-1', character: 'mira', text: 'The train carried everyone across the city. Not one levitation spell!' },
  { id: 'train-2', character: 'theo', text: 'Tracks, electricity, and a lot of careful coordination. The timetable might be the most impressive part.' },
  { id: 'train-3', character: 'mira', text: 'Tomorrow we should try buying tickets ourselves. Today I accidentally asked the machine for directions.' },
] }
