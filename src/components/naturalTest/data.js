import { CARD_DESCRIPTIONS } from '../research/cardDescriptions'
import { withResearchPhoto } from '../research/photoConfig'
import { PIGMENTS } from '../../edition/palette'
import { MOTION } from '../bigTest/config'
import { ARTICLES_BY_ID } from './articles'
export const STYLE = { cream:PIGMENTS.paper, panel:PIGMENTS.white, white:PIGMENTS.white, ink:PIGMENTS.ink, teal:PIGMENTS.mint, yellow:PIGMENTS.butter, blue:PIGMENTS.sky, pink:PIGMENTS.strawberry, mint:PIGMENTS.mint, peach:PIGMENTS.peach, motion: MOTION }
// Compact category bounds include every topic row; photo slots grow only during reading.
export const CAMERA = { minScale: .16, maxScale: 1.8, categoryScale: .85, entryScale: 1.05, normalThreshold: .28, detailThreshold: 1.15, padding: 55 }
export const CATEGORIES = [
  { id:'land', name:'LAND & GEOLOGY', chineseName:'陸地與地質', introduction:'Landforms, minerals and a moving planet.', color:STYLE.pink, x:180, y:260, decoration:'stripes', entries:['volcano','earthquakes','plate-tectonics','rocks-minerals','minerals','mountains-valleys'] },
  { id:'water', name:'OCEANS & WATER', chineseName:'海洋與水域', introduction:'Ocean currents, freshwater and the water cycle.', color:STYLE.blue, x:2980, y:120, decoration:'circle', entries:['currents','water-cycle','rivers-lakes','lakes','tides','deep-sea'] },
  { id:'weather', name:'ATMOSPHERE & CLIMATE', chineseName:'大氣與氣候', introduction:'Clouds, weather and long-term patterns.', color:STYLE.yellow, x:5780, y:410, decoration:'dots', entries:['clouds','aurora','storms','atmosphere','seasons','seasonal-cycle'] },
  { id:'plants', name:'PLANTS & FUNGI', chineseName:'植物與真菌', introduction:'生長、繁殖，以及植物、真菌與傳粉生物的關係。', color:STYLE.mint, x:580, y:2250, decoration:'grid', entries:['photosynthesis','flowering-plants','pollinators','forests','fungi','seeds'] },
  { id:'life', name:'ANIMALS & LIFE', chineseName:'動物與生命', introduction:'從演化與動物行為，理解生命的多樣性、生態互動與保育。', color:STYLE.peach, x:3580, y:2300, decoration:'orbit', entries:['evolution','animal-diversity','animal-behavior','origin-of-life','ecosystems','biodiversity'] },
  { id:'astronomy', name:'UNIVERSE & ASTRONOMY', chineseName:'宇宙與天文', introduction:'人類如何透過觀測、理論與太空探測，研究宇宙及其演變。', color:STYLE.teal, x:6580, y:2450, decoration:'orbit', entries:['observational-astronomy','stellar-evolution','galaxies','cosmology','space-exploration','exoplanets'] },
].map(category => ({ ...category, width:1120, height:Math.max(1150, 340 + Math.ceil(category.entries.length / 2) * 270) }))
// Positions use the same world-space cards, with enough room for wrapped titles.
const entryPosition = index => {
  const row = Math.floor(index / 2), column = index % 2
  return [column ? [580,560,575][row % 3] : [40,65,45][row % 3], 300 + row * 270 + column * 22]
}
const icons = { land:'mountain', water:'waves', weather:'cloud', plants:'leaf', life:'flower', astronomy:'sun' }
const retainedIcons = { volcano:'mountain', earthquakes:'fault', currents:'waves', 'water-cycle':'drop', aurora:'rays', clouds:'cloud', ecosystems:'leaf', pollinators:'flower', seasons:'sun' }
export const ENTRIES = CATEGORIES.flatMap(category => category.entries.map((id,index) => {
  const item = ARTICLES_BY_ID[id], [x,y] = entryPosition(index)
  return { id, category:category.id, title:item.title, chineseName:item.chineseName, description:CARD_DESCRIPTIONS.natural[id], detail:'FIELD NOTES', x,y, icon:retainedIcons[id] ?? icons[category.id], article:id, note:id }
}))
export const ARTICLES = Object.fromEntries(ENTRIES.map((entry,index) => [entry.article, { ...withResearchPhoto('natural', ARTICLES_BY_ID[entry.article]), subtitle:ARTICLES_BY_ID[entry.article].chineseName, page:String(index+1).padStart(2,'0') }]))
// Keep the existing student-note wording for retained subjects. New notes are
// neutral observation prompts, not newly invented character dialogue.
const existingTitles = { volcano:'VOLCANO', earthquakes:'EARTHQUAKES', currents:'OCEAN CURRENTS', 'water-cycle':'THE WATER CYCLE', aurora:'AURORA', clouds:'CLOUD WATCHING', ecosystems:'ECOSYSTEMS & FOOD WEBS', pollinators:'POLLINATORS', seasons:'CLIMATE & LONG-TERM PATTERNS' }
export const NOTES = Object.fromEntries(ENTRIES.map(entry => [entry.note, existingTitles[entry.id]
  ? { author:'Mira · Student researcher', text:`My next question about ${existingTitles[entry.id].toLowerCase()}: what would I notice if I returned to the same place tomorrow?`, color:STYLE.yellow }
  : { author:'觀察筆記', text:`閱讀「${entry.chineseName}」時，區分直接觀察到的證據、解釋與仍待研究的問題，並核對下方資料來源。`, color:STYLE.yellow }
]))
export const entryById = Object.fromEntries(ENTRIES.map(entry => [entry.id,entry]))
