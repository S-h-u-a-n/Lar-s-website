import { STYLE } from '../naturalTest/data'
import { ARTICLES_BY_ID } from './articles'
export { STYLE }
export const CATEGORIES = [
  { id:'history', name:'HISTORY & CIVILIZATION', chineseName:'歷史與文明', introduction:'Origins, cities and connections across time.', x:0, y:0, color:STYLE.yellow, decoration:'architecture', landmark:'3000 BCE', entries:['early-humans','cities','ancient-civilizations','trade-routes','timeline'] },
  { id:'culture', name:'CULTURE & ARTS', chineseName:'文化與藝術', introduction:'Images, performances and shared traditions.', x:2800, y:-150, color:STYLE.pink, decoration:'pages', landmark:'ACT I', entries:['visual-arts','music','theatre','books','film-animation','cultural-heritage'] },
  { id:'society', name:'SOCIETY & DAILY LIFE', chineseName:'社會與日常生活', introduction:'Learning, movement and life together.', x:5600, y:450, color:STYLE.mint, decoration:'city', landmark:'08:30', entries:['family-community','library','food-culture','commute','bridges','conversation'] },
  { id:'technology', name:'SCIENCE & TECHNOLOGY', chineseName:'科學與科技', introduction:'Evidence, tools and connected systems.', x:500, y:2100, color:STYLE.blue, decoration:'circuit', landmark:'0101', entries:['scientific-method','printing','electricity','computers','networks','space-exploration'] },
  { id:'politics', name:'POLITICS & ECONOMY', chineseName:'政治與經濟', introduction:'Institutions, resources and public decisions.', x:3500, y:2250, color:STYLE.teal, decoration:'architecture', landmark:'PUBLIC', entries:['government','laws-rights','democracy','money-trade','economic-systems','international-cooperation'] },
  { id:'language', name:'LANGUAGE & BELIEFS', chineseName:'語言與信仰', introduction:'Words, stories and ways of understanding.', x:6500, y:2600, color:STYLE.peach, decoration:'pages', landmark:'Aa', entries:['language-families','writing-systems','language-change','mythology','religions','folklore'] },
].map(category => ({ ...category, width:1500, height:Math.max(1550, 500 + Math.ceil(category.entries.length / 2) * 350) }))
const entryPosition = index => {
  const row = Math.floor(index / 2), column = index % 2
  return [column ? [810,790,805][row % 3] : [55,90,60][row % 3], 440 + row * 350 + column * 35]
}
const specialTypes = { timeline:'infographic', books:'recommendation', conversation:'story' }
export const ENTRIES = CATEGORIES.flatMap(category => category.entries.map((id,index) => {
  const item=ARTICLES_BY_ID[id], [x,y]=entryPosition(index), type=specialTypes[id] ?? 'article'
  return { id, category:category.id, title:item.title, chineseName:item.chineseName, description:item.description, type, x,y, content:id, detail:type.toUpperCase(), image:null }
}))
export const entryById = Object.fromEntries(ENTRIES.map(entry => [entry.id,entry]))
const existingIds = new Set(['cities','timeline','theatre','books','commute','conversation','printing','networks','bridges','library'])
export const CONTENT = Object.fromEntries(ENTRIES.map(entry => [entry.id, {
  ...ARTICLES_BY_ID[entry.id], subtitle:ARTICLES_BY_ID[entry.id].chineseName,
  note:existingIds.has(entry.id) ? 'A useful question for our next visit: which everyday skill would we need to learn before leaving our wands at home?' : null,
  author:existingIds.has(entry.id) ? 'Mira · student researcher' : null,
}]))
// Existing timeline, recommendation and dialogue are retained verbatim below.
CONTENT.timeline.steps = [{ year: 'c. 3200 BCE', title: 'Writing', text: 'Marks preserve words beyond a conversation.' }, { year: 'c. 1450', title: 'Printing in Europe', text: 'Movable type helps reproduce pages in large numbers.' }, { year: '1830s', title: 'Railways expand', text: 'Schedules become part of everyday journeys.' }, { year: '1990s', title: 'The Web', text: 'Linked documents connect readers across distances.' }]
CONTENT.books.work = { name: 'Around the World in Eighty Days', kind: 'Novel · Jules Verne', description: 'A fictional journey shaped by transport, timetables, and unexpected company.', recommendation: 'Try reading with a map nearby. We kept pausing to ask how the travelers would solve each problem without a portal.' }
export const CHARACTERS = { mira: { name: 'Mira', initials: 'MI', color: STYLE.pink, avatar: null }, theo: { name: 'Theo', initials: 'TH', color: STYLE.blue, avatar: null } }
// Same chapter/dialogue shape as GlobeTest; Human content remains independent.
CONTENT.conversation.chapter = { id: 'ordinary-train', title: 'No Spell Required', background: null, dialogue: [
  { id: 'train-1', character: 'mira', text: 'The train carried everyone across the city. Not one levitation spell!' },
  { id: 'train-2', character: 'theo', text: 'Tracks, electricity, and a lot of careful coordination. The timetable might be the most impressive part.' },
  { id: 'train-3', character: 'mira', text: 'Tomorrow we should try buying tickets ourselves. Today I accidentally asked the machine for directions.' },
] }
