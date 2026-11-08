import { useEffect, useState, useSyncExternalStore } from 'react'
import { createDialogueController } from './dialogueController'
export default function useYutaDialogue() {
  const [controller] = useState(() => {
    let storage
    try { storage = window.localStorage } catch { /* Session-only operation. */ }
    return createDialogueController({ storage })
  })
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) controller.tick() }, 1000)
    return () => clearInterval(timer)
  }, [controller])
  return { ...state, controller }
}
