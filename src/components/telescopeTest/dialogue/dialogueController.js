import { YUTA_DIALOGUE, CHAT_GROUP_IDS } from './yutaDialogue.js'
import { MODE_DIALOGUE, MODE_SWITCH_CONFIG } from './modeDialogue.js'
import { sameObservation, validObservation } from '../observations.js'

export const DIALOGUE_STORAGE_KEY = 'genesis:telescope:yuta-dialogue:v1'
export const DIALOGUE_CONFIG = Object.freeze({ idleAfterMs: 30000, idle2Chance: .2, hintAfterMs: 45000, hintCooldownMs: 60000, hintOrder: ['random', 'recommendations', 'collection'], advanceGuardMs: 140 })
const fresh = () => ({ version: 1, introCompleted: false, randomCount: 0, favoriteCount: 0, used: {}, shownHints: [], chatBag: [], lastChat: null, lastRandom: null, creditedFavorites: [] })
function read(storage) {
  try {
    const raw = storage?.getItem(DIALOGUE_STORAGE_KEY)
    if (!raw) return { progress: fresh(), writable: true }
    const p = JSON.parse(raw)
    if (p.version !== 1 || typeof p.introCompleted !== 'boolean' || ![p.randomCount, p.favoriteCount].every(n => Number.isSafeInteger(n) && n >= 0)
      || !p.used || typeof p.used !== 'object' || !Array.isArray(p.shownHints) || !Array.isArray(p.chatBag) || p.chatBag.some(id => !CHAT_GROUP_IDS.includes(id))
      || !Array.isArray(p.creditedFavorites) || p.creditedFavorites.some(item => !validObservation(item))) throw new Error('Invalid Yuta progress')
    return { progress: p, writable: true }
  } catch { return { progress: fresh(), writable: false } }
}

export function createDialogueController({ storage, now = Date.now, random = Math.random, config = DIALOGUE_CONFIG, initialMode = 'globe', initialEntry = 'intro' } = {}) {
  const loaded = read(storage), progress = loaded.progress, listeners = new Set()
  let revision = 0, interaction = 0, active = null, lastSegment = null, lastAdvance = -Infinity, passive = null
  let currentMode = initialMode, switches = [], lastBurst = -Infinity
  const lastModeLine = {}
  let lastInteraction = now(), lastHint = now()
  let snapshot
  function persist() {
    if (!loaded.writable) return
    try { storage?.setItem(DIALOGUE_STORAGE_KEY, JSON.stringify(progress)) } catch { /* Keep session progress when browser storage is unavailable. */ }
  }
  function emit() {
    snapshot = { active: Boolean(active), kind: active?.kind ?? passive?.kind ?? null, group: active?.group ?? passive?.group ?? null, index: active?.index ?? (passive ? 0 : null),
      segment: active ? active.segments[active.index] : lastSegment, segmentKey: revision, segmentMotion: active ? active.segments[active.index].motion : passive ? lastSegment.motion : null,
      hasNext: Boolean(active && active.index + 1 < active.segments.length), introActive: active?.kind === 'intro', introCompleted,
      interaction, randomCount: progress.randomCount, favoriteCount: progress.favoriteCount }
    listeners.forEach(listener => listener())
  }
  function touch() { interaction++; lastInteraction = now() }
  function start(group, kind, selection = null) {
    if (active?.kind === 'intro') return false
    if (kind === 'hint' && active) return false
    if (kind === 'chat' && active && active.kind !== 'hint') return false
    const segments = selection ? [YUTA_DIALOGUE[group].segments[selection.index]] : YUTA_DIALOGUE[group].segments
    passive = null
    active = { group, kind, segments, index: 0 }
    lastSegment = segments[0]
    revision++
    emit()
    return true
  }
  function markUsed(feature) { progress.used[feature] = true; persist() }
  // Initialization is read-only so StrictMode's discarded render cannot mark
  // a tutorial complete or consume a chat from the persistent shuffle bag.
  const entry = initialEntry === 'welcome' ? 'welcome' : 'intro'
  let introCompleted = entry === 'welcome'
  active = { group: entry, kind: entry, segments: YUTA_DIALOGUE[entry].segments, index: 0 }
  lastSegment = active.segments[0]
  revision++
  emit()
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    getSnapshot: () => snapshot,
    advance() {
      if (!active || now() - lastAdvance < config.advanceGuardMs) { touch(); emit(); return false }
      lastAdvance = now(); touch()
      if (active.index + 1 < active.segments.length) {
        active = { ...active, index: active.index + 1 }
        lastSegment = active.segments[active.index]
      } else {
        if (active.kind === 'intro') introCompleted = true
        active = null
      }
      revision++; emit(); return true
    },
    talk() {
      touch()
      if (active && active.kind !== 'hint') { emit(); return false }
      if (!progress.chatBag.length) {
        progress.chatBag = [...CHAT_GROUP_IDS]
        for (let i = progress.chatBag.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1)); [progress.chatBag[i], progress.chatBag[j]] = [progress.chatBag[j], progress.chatBag[i]]
        }
        if (progress.chatBag[0] === progress.lastChat) [progress.chatBag[0], progress.chatBag[1]] = [progress.chatBag[1], progress.chatBag[0]]
      }
      const group = progress.chatBag.shift(); progress.lastChat = group; persist()
      return start(group, 'chat')
    },
    feature(feature) {
      touch(); markUsed(feature)
      if (active?.kind === 'intro') { emit(); return false }
      return start(`hint-${feature}`, 'function')
    },
    randomObserved() {
      touch(); markUsed('random')
      progress.randomCount++; persist()
      if (active?.kind === 'intro') { emit(); return false }
      if ([5, 10].includes(progress.randomCount)) return start(`random-milestone-${progress.randomCount}`, 'function')
      const choices = YUTA_DIALOGUE.random.segments.map((_, index) => index).filter(index => index !== progress.lastRandom)
      const index = choices[Math.floor(random() * choices.length)]
      progress.lastRandom = index; persist()
      return start('random', 'function', { index })
    },
    favoriteAdded(location) {
      touch(); markUsed('collection')
      if (!validObservation(location) || progress.creditedFavorites.some(item => sameObservation(item, location))) { emit(); return false }
      progress.creditedFavorites.push({ ...location }); progress.favoriteCount++; persist()
      if ([1, 5, 10].includes(progress.favoriteCount)) return start(`favorite-${progress.favoriteCount}`, 'function')
      emit(); return false
    },
    modeSwitched(mode, { announce = true } = {}) {
      if (!['globe', 'satellite'].includes(mode) || mode === currentMode) return false
      currentMode = mode
      touch()
      if (!announce || active?.kind === 'intro') { switches = []; emit(); return false }
      const timestamp = now()
      switches = switches.filter(time => timestamp - time <= MODE_SWITCH_CONFIG.windowMs)
      let group = mode === 'globe' ? 'mode-map' : 'mode-view'
      if (timestamp - lastBurst >= MODE_SWITCH_CONFIG.cooldownMs) {
        switches.push(timestamp)
        if (switches.length >= MODE_SWITCH_CONFIG.count) { group = 'mode-burst'; lastBurst = timestamp; switches = [] }
      } else switches = []
      const lines = MODE_DIALOGUE[group]
      const choices = lines.map((_, i) => i).filter(i => i !== lastModeLine[group])
      const index = choices[Math.floor(random() * choices.length)]
      lastModeLine[group] = index
      active = null
      passive = { kind: 'mode', group }
      lastSegment = lines[index]
      revision++
      emit()
      return true
    },
    tick() {
      if (active || passive?.kind === 'mode' || now() - lastInteraction < config.hintAfterMs || now() - lastHint < config.hintCooldownMs) return false
      const feature = config.hintOrder.find(name => !progress.used[name] && !progress.shownHints.includes(name))
      if (!feature) return false
      progress.shownHints.push(feature); lastHint = now(); persist()
      return start(`hint-${feature}`, 'hint')
    },
  }
}
