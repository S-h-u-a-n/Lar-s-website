import { loadBigContent } from './bigContentParser'

const categories = {
  letters: import.meta.glob('/content/letters/*.md', { eager: true, query: '?raw', import: 'default' }),
  researchLogs: import.meta.glob('/content/research-logs/*.md', { eager: true, query: '?raw', import: 'default' }),
  celestialNotes: import.meta.glob('/content/celestial-notes/*.md', { eager: true, query: '?raw', import: 'default' }),
}

const iconModules = import.meta.glob('/Art/Big/Big-letter/*.{PNG,png,JPG,jpg,JPEG,jpeg,WEBP,webp,SVG,svg}', {
  eager: true, query: '?url', import: 'default',
})
const icons = Object.fromEntries(Object.entries(iconModules).map(([path, url]) => [path.split('/').at(-1), url]))

export const LETTERS = loadBigContent(categories.letters, 'letters', icons)
export const RESEARCH_LOGS = loadBigContent(categories.researchLogs, 'research-logs', icons)
export const NOTES = loadBigContent(categories.celestialNotes, 'celestial-notes', icons)
