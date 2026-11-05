import { useSyncExternalStore } from 'react'
import { TOOLS, DESK_OBJECTS } from '../../edition/config'

export const CHECKLIST_KEY = 'genesis:earth-checklist:v1'
export const COMPLETION_TEXT = '檢查完畢！地球今天也運轉得很好呢。'
export const CHECKLIST_ITEMS = [
  ...TOOLS.map(({ id, name }) => ({ id, name })),
  ...DESK_OBJECTS.map(([id, name]) => ({ id, name })),
  { id: 'letter', name: '信件' },
  { id: 'diary', name: '研究日誌' },
  { id: 'notes', name: '研究筆記' },
]
const validIds = new Set(CHECKLIST_ITEMS.map(item => item.id))
export function normalizeProgress(value) {
  const completed = [...new Set((Array.isArray(value?.completed) ? value.completed : []).filter(id => validIds.has(id)))]
  const unlocked = CHECKLIST_ITEMS.every(item => completed.includes(item.id))
  return { completed, unlocked, unlockedText: unlocked ? COMPLETION_TEXT : null }
}
function readProgress() {
  try { return normalizeProgress(JSON.parse(localStorage.getItem(CHECKLIST_KEY))) }
  catch { return normalizeProgress(null) }
}
let progress = readProgress()
const listeners = new Set()
function publish(next) { progress = next; listeners.forEach(listener => listener()) }
export function markEarthExplored(id) {
  if (!validIds.has(id)) return
  // Merge persisted progress so another tab's completed items are preserved.
  const next = normalizeProgress({ completed: [...progress.completed, ...readProgress().completed, id] })
  if (JSON.stringify(next) === JSON.stringify(progress)) return
  try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next)) } catch { /* Keep progress in memory when storage is unavailable. */ }
  publish(next)
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === CHECKLIST_KEY) publish(readProgress())
})
export function useEarthProgress() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener) }, () => progress)
}
