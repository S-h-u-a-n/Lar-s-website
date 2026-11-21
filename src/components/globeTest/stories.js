import { PALETTE } from './config'
import { ALL_CHAPTERS, STORY_GROUPS } from './globeMarkdown'
import { characterImages } from '../../dev/characters/characters'

export { ALL_CHAPTERS, STORY_GROUPS }

const scriptNames = [...new Set(Object.values(STORY_GROUPS).flat().flatMap(topic => topic.dialogue.map(message => message.character)))]
export const CHARACTERS = Object.fromEntries(
  [...new Set([...Object.keys(characterImages), ...scriptNames])].map(name => [name, { name, color: PALETTE.cream, avatar: characterImages[name] ?? null }]),
)
