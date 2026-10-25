import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import DevEditorLauncher from './DevEditorLauncher'
import TextEditor from './TextEditor'
import TextDraftLayer from './TextDraftLayer'
import DomPageAdapter from './DomPageAdapter'
import { closeDevEditor, useDevEditorState } from './devEditorStore'
import { EDITOR_UI } from './pageEditorRegistry'
import { enablePageTextPersistence } from './textEditorStore'
import './PageEditors.css'

export default function PageEditors({ pageId, busy }) {
  const { active } = useDevEditorState()
  useEffect(() => {
    // Keep the editor from intercepting input while an existing transition runs.
    if (busy) closeDevEditor()
  }, [busy])
  useEffect(() => {
    closeDevEditor()
    return enablePageTextPersistence(pageId, pageId === 'home' ? 'main-' : pageId === 'comic' ? 'story' : `${pageId}-`)
  }, [pageId])
  useEffect(() => {
    if (!active) return
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeDevEditor() }
      else if (event.target instanceof Element && event.target.closest(EDITOR_UI)) event.stopPropagation()
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  }, [active])
  useEffect(() => {
    document.body.dataset.devEditing = active?.kind || ''
    return () => { delete document.body.dataset.devEditing }
  }, [active])
  return createPortal(<>
    <DomPageAdapter key={pageId} pageId={pageId} />
    <DevEditorLauncher disabled={busy} />
    <TextDraftLayer pageId={pageId} />
    <TextEditor pageId={pageId} />
  </>, document.body)
}
