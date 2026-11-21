import { useEffect, useRef } from 'react'
import { useRegisterDevEditor } from './devEditorStore'
import { buildTextStyle, registerText, unregisterText, useTextEditorState } from './textEditorStore'

function DraftText({ id, entry }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    registerText(id, entry.label, ref.current, 'draft')
    return () => unregisterText(id)
  }, [id, entry.label])

  return (
    <div ref={ref} className="text-draft" data-text-editor-id={id} style={buildTextStyle(entry)}>
      {entry.values.text}
    </div>
  )
}

// Renders page-scoped drafts; production consumers only display restored values.
function TextDraftLayer({ pageId }) {
  const { data } = useTextEditorState()
  useRegisterDevEditor('text', 'text-draft-layer')

  return (
    <div className="text-draft-layer">
      {Object.entries(data)
        .filter(([, entry]) => entry.type === 'draft' && entry.pageId === pageId)
        .map(([id, entry]) => <DraftText key={id} id={id} entry={entry} />)}
    </div>
  )
}

export default TextDraftLayer
