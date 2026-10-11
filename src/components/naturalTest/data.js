import { PIGMENTS } from '../../edition/palette'
import { MOTION } from '../bigTest/config'
// Shared edition pigments; category positions use world coordinates.
export const STYLE = { cream:PIGMENTS.paper, panel:PIGMENTS.white, white:PIGMENTS.white, ink:PIGMENTS.ink, teal:PIGMENTS.mint, yellow:PIGMENTS.butter, blue:PIGMENTS.sky, pink:PIGMENTS.strawberry, mint:PIGMENTS.mint, peach:PIGMENTS.peach, motion: MOTION }
export const CAMERA = { minScale: .16, maxScale: 1.8, categoryScale: .85, entryScale: 1.05, normalThreshold: .4, detailThreshold: 1.15, padding: 55 }
// Add a category and its entry IDs here; no component changes are required.
export const CATEGORIES = [
  { id: 'land', name: 'LAND & GEOLOGY', introduction: 'Reading the restless ground beneath our feet.', color: STYLE.pink, x: 180, y: 260, width: 900, height: 650, decoration: 'stripes', entries: ['volcano', 'earthquakes'] },
  { id: 'water', name: 'OCEANS & WATER', introduction: 'Follow water through a world in motion.', color: STYLE.blue, x: 1430, y: 120, width: 860, height: 650, decoration: 'circle', entries: ['currents', 'water-cycle'] },
  { id: 'weather', name: 'WEATHER & CLIMATE', introduction: 'A field notebook for the changing sky.', color: STYLE.yellow, x: 2650, y: 410, width: 980, height: 700, decoration: 'dots', entries: ['aurora', 'clouds'] },
  { id: 'life', name: 'LIFE & ECOSYSTEMS', introduction: 'Small connections. Living landscapes.', color: STYLE.mint, x: 580, y: 1350, width: 1050, height: 680, decoration: 'grid', entries: ['ecosystems', 'pollinators'] },
  { id: 'space', name: 'EARTH & SPACE', introduction: 'Our planet in a much larger neighbourhood.', color: STYLE.peach, x: 2230, y: 1390, width: 1100, height: 650, decoration: 'orbit', entries: ['moon-phases', 'seasons'] },
]
// Entry positions are relative to their category. Article and note IDs are separate.
export const ENTRIES = [
  { id: 'volcano', title: 'VOLCANO', description: 'When the inside of Earth reaches the surface.', detail: 'A sketchbook of vents, lava and new landscapes.', x: 70, y: 285, icon: 'mountain', article: 'volcano', note: 'volcano' },
  { id: 'earthquakes', title: 'EARTHQUAKES', description: 'Listening to a planet that never stands still.', detail: 'Trace the stories hidden along faults.', x: 440, y: 440, icon: 'fault', article: 'earthquakes', note: 'earthquakes' },
  { id: 'currents', title: 'OCEAN CURRENTS', description: 'Invisible paths across a blue world.', detail: 'A starting point for tracing moving water.', x: 30, y: 305, icon: 'waves', article: 'currents', note: 'currents' },
  { id: 'water-cycle', title: 'THE WATER CYCLE', description: 'A journey without a final destination.', detail: 'Follow a drop from sea to sky and back.', x: 400, y: 455, icon: 'drop', article: 'water-cycle', note: 'water-cycle' },
  { id: 'aurora', title: 'AURORA', description: 'A luminous question written across the sky.', detail: 'Explore the connection between Earth and the Sun.', x: 80, y: 315, icon: 'rays', article: 'aurora', note: 'aurora' },
  { id: 'clouds', title: 'CLOUD WATCHING', description: 'Collecting shapes from a changing sky.', detail: 'A field guide waiting for your observations.', x: 470, y: 480, icon: 'cloud', article: 'clouds', note: 'clouds' },
  { id: 'ecosystems', title: 'ECOSYSTEMS', description: 'Every living place is a web of relationships.', detail: 'Look for connections rather than isolated things.', x: 100, y: 280, icon: 'leaf', article: 'ecosystems', note: 'ecosystems' },
  { id: 'pollinators', title: 'POLLINATORS', description: 'The small visitors that connect a garden.', detail: 'Leave room for a future field illustration.', x: 520, y: 460, icon: 'flower', article: 'pollinators', note: 'pollinators' },
  { id: 'moon-phases', title: 'MOON PHASES', description: 'One Moon, many familiar shapes.', detail: 'A quiet diary of a changing view.', x: 80, y: 280, icon: 'moon', article: 'moon-phases', note: 'moon-phases' },
  { id: 'seasons', title: 'SEASONS', description: 'A yearly rhythm of light and landscape.', detail: 'Compare observations from different places.', x: 540, y: 450, icon: 'sun', article: 'seasons', note: 'seasons' },
]
// These are short editorial placeholders, not a complete science curriculum.
export const ARTICLES = Object.fromEntries(ENTRIES.map((entry, index) => [entry.article, { title: entry.title, subtitle: 'A student field notebook', paragraphs: [entry.description, 'Begin by observing. Make a sketch, record a question, and compare what you notice with another student. This first notebook entry leaves space for the full research article and its diagrams.', 'Future notes can include field observations, sources and illustrations. Each small discovery adds another connection to our map of the natural world.'], image: null, imageAlt: '', page: String(index + 1).padStart(2, '0') }]))
export const NOTES = Object.fromEntries(ENTRIES.map(entry => [entry.note, { author: 'Mira · Student researcher', text: `My next question about ${entry.title.toLowerCase()}: what would I notice if I returned to the same place tomorrow?`, color: STYLE.yellow }]))
export const entryById = Object.fromEntries(ENTRIES.map(entry => [entry.id, entry]))
