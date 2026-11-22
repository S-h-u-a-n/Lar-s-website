import { portraitTransition } from './portraitTransitions.js'

const speakers = { '拉爾': 'lar', '緹芙波': 'tivbo', lar: 'lar', tivbo: 'tivbo' }
export function parseCharacterCue(value) {
  const match = String(value).trim().match(/^(拉爾|緹芙波)[（(]\s*(\d+)\s*\/\s*(\d+)(?:\s*\/\s*(\d+))?\s*[）)]$/u)
  if (!match) throw new Error(`Invalid character cue: ${value}`)
  const body = Number(match[2]), face = Number(match[3]), transition = Number(match[4] ?? 0)
  if (body < 1 || face < 1) throw new Error(`Body and face numbers start at 1: ${value}`)
  portraitTransition(transition)
  return { speaker: speakers[match[1]], body, face, transition }
}
export function parseDialogueScript(source, { allowEmpty = false } = {}) {
  const dialogue = []
  let cue = null, lines = []
  const finish = () => {
    if (!cue) return
    const text = lines.join('\n').trim()
    if (allowEmpty && (!text || /^「\s*」$/u.test(text))) return
    if (!text) throw new Error('Character cue is missing dialogue text')
    dialogue.push({ ...cue, text })
  }
  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*(拉爾|緹芙波)[（(]/u.test(line)) {
      finish(); cue = parseCharacterCue(line); lines = []
    } else if (cue) lines.push(line)
    else if (line.trim()) throw new Error('Dialogue must start with a character cue')
  }
  finish()
  return dialogue
}
export function normalizeDialogue(value = []) {
  if (typeof value === 'string') return parseDialogueScript(value)
  return value.map(line => {
    if (/[（(]/u.test(line.speaker)) return { ...line, ...parseCharacterCue(line.speaker) }
    const speaker = speakers[line.speaker]
    if (!speaker) throw new Error(`Unknown dialogue speaker: ${line.speaker}`)
    portraitTransition(line.transition ?? 0)
    return { ...line, speaker, transition: line.transition ?? 0 }
  })
}
// Keep each character's last pose and cue index while the other one speaks.
export function dialoguePortraits(dialogue, index) {
  const result = {}
  for (let i = 0; i <= Math.min(index, dialogue.length - 1); i++) {
    const line = dialogue[i], pose = result[line.speaker] ?? {}
    result[line.speaker] = { ...pose,
      ...(line.body !== undefined ? { body: line.body } : {}),
      ...(line.face !== undefined ? { face: line.face } : {}),
      transition: line.transition ?? 0, cueIndex: i,
    }
  }
  return result
}
