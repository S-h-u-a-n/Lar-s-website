import { useEffect, useSyncExternalStore } from 'react'

// DEV-only: editors register here; the launcher opens at most one at a time.
let state = { editors: [], active: null }
const listeners = new Set()

const setState = next => {
  state = next
  listeners.forEach(listener => listener())
}
const subscribe = listener => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const getState = () => state

export function useDevEditorState() {
  return useSyncExternalStore(subscribe, getState)
}

export function useRegisterDevEditor(kind, id, enabled = true) {
  useEffect(() => {
    if (!import.meta.env.DEV || !enabled) return undefined
    setState({ ...state, editors: [...state.editors, { kind, id }] })
    return () => {
      setState({
        editors: state.editors.filter(editor => editor.id !== id),
        active: state.active?.id === id ? null : state.active,
      })
    }
  }, [enabled, kind, id])
}

export function useIsDevEditorActive(id) {
  return useDevEditorState().active?.id === id
}

// Opens the most recently registered editor of this kind (e.g. an expanded document over the page layout).
export function toggleDevEditor(kind) {
  if (state.active?.kind === kind) {
    setState({ ...state, active: null })
    return
  }
  const target = [...state.editors].reverse().find(editor => editor.kind === kind)
  if (target) setState({ ...state, active: target })
}

export function closeDevEditor() {
  if (state.active) setState({ ...state, active: null })
}
