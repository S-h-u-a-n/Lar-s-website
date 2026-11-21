import { DIALOGUE_CONFIG } from './dialogueController.js'
export const DIALOGUE_IDLE_WEIGHTS = Object.freeze({ '待機3': .7, '待機一般': .15, '待機1': .15 })
const DIALOGUE_MOTIONS = new Set(['開場', '指右邊', '指右邊-開心', '開心', '感興趣'])
export function isDialogueMotion(name) {
  return name?.startsWith('對話') || DIALOGUE_MOTIONS.has(name)
}
export function chooseDialogueIdle(random = Math.random) {
  const value = random()
  if (value < DIALOGUE_IDLE_WEIGHTS['待機3']) return '待機3'
  if (value < DIALOGUE_IDLE_WEIGHTS['待機3'] + DIALOGUE_IDLE_WEIGHTS['待機一般']) return '待機一般'
  return '待機1'
}
export function chooseIdleMotion({ current, dialogueActive, idleForMs }, random = Math.random) {
  if (current === '待機一般' || current === '待機1' || current === '待機2') return '待機3'
  if (!dialogueActive && idleForMs >= DIALOGUE_CONFIG.idleAfterMs && random() < DIALOGUE_CONFIG.idle2Chance) return '待機2'
  return random() < .5 ? '待機一般' : '待機1'
}
