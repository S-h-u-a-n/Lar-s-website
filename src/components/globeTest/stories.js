import { PALETTE } from './config'
import { ASIA_STORIES } from './asiaStories'
import { REGIONAL_STORIES } from './regionalStories'

export const STORY_GROUPS = { asia: ASIA_STORIES, ...REGIONAL_STORIES }
// Drafts remain in STORY_GROUPS for editing, but cannot render/open as chats.
export const ALL_CHAPTERS = Object.values(STORY_GROUPS).flat().filter(topic => topic.status !== 'draft' && topic.dialogue.length > 0)

// Exact filename/name matching only; Vite resolves and fingerprints each asset.
const avatarFiles = import.meta.glob('../../../Art/avatar/*.{jpg,jpeg,png,JPG,JPEG,PNG,webp,WEBP}', { eager: true, query: '?url', import: 'default' })
const avatars = Object.fromEntries(Object.entries(avatarFiles).map(([path, url]) => [path.split('/').pop().replace(/\.[^.]+$/, ''), url]))
const scriptNames = [...new Set(Object.values(STORY_GROUPS).flat().flatMap(topic => topic.dialogue.map(message => message.character)))]
export const CHARACTERS = {
  ...Object.fromEntries([...new Set([...Object.keys(avatars), ...scriptNames])].map(name => [name, { name, color: PALETTE.cream, avatar: avatars[name] ?? null }])),
}
