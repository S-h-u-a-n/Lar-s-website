import { parseGlobeMarkdown, parseGlobeStories } from './globeContentParser'

const bodyFiles = import.meta.glob('/content/globe/bodies/*.md', { eager: true, query: '?raw', import: 'default' })
const continentFiles = import.meta.glob('/content/globe/continents/*.md', { eager: true, query: '?raw', import: 'default' })
const solarSystemFile = import.meta.glob('/content/globe/solar-system.md', { eager: true, query: '?raw', import: 'default' })

function parseFiles(files, includeStories = false) {
  return Object.values(files)
    .map(markdown => parseGlobeMarkdown(markdown, { includeStories }))
    .sort((a, b) => a.order - b.order)
}

export const BODIES = parseFiles(bodyFiles)
export const CONTINENTS = parseFiles(continentFiles, true)
export const STORY_GROUPS = Object.fromEntries([
  ...CONTINENTS.map(continent => [continent.id, continent.stories]),
  ['celestial', parseGlobeStories(Object.values(solarSystemFile)[0] ?? '')],
])
export const ALL_CHAPTERS = Object.values(STORY_GROUPS)
  .flat()
  .filter(story => story.title)
