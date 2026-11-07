import { useEffect, useRef } from 'react'
import { useRegisterDevEditor } from './devEditorStore'
import { buildTextStyle, registerText, unregisterText, useTextEditorState } from './textEditorStore'

const PROD_RESULT = { ref: null, props: {}, text: undefined }

// Usage: <p ref={t.ref} {...t.props}>{t.text ?? originalChildren}</p>. Production returns inert values.
function useEditableTextDev({ id, label, coordinateSpace, defaultValues, sourceRevision }) {
  const ref = useRef(null)
  useRegisterDevEditor('text', id)
  useEffect(() => {
    registerText(id, label, ref.current, 'registered', { coordinateSpace, defaultValues, sourceRevision })
    return () => unregisterText(id)
  }, [id, label, coordinateSpace, defaultValues, sourceRevision])

  const entry = useTextEditorState().data[id]
  const props = { 'data-text-editor-id': id }
  if (!entry) return { ref, props, text: undefined, defaultText: defaultValues?.text }
  props.style = buildTextStyle(entry)
  return { ref, props, text: entry.values.text !== entry.defaults.text ? entry.values.text : undefined, defaultText: entry.defaults.text }
}

export const useEditableText = import.meta.env.DEV ? useEditableTextDev : () => PROD_RESULT

// Opt-in read-only production rendering; leaves other pages' text behavior unchanged.
function usePersistedText({ id, defaultValues, sourceRevision }) {
  const entry = useTextEditorState().data[id]
  if (!entry) return PROD_RESULT
  if (sourceRevision && entry.sourceRevision !== sourceRevision) {
    const values = { ...entry.values, ...defaultValues }
    return { ref: null, props: { style: buildTextStyle({ ...entry, values }) }, text: values.text }
  }
  return { ref: null, props: { style: buildTextStyle(entry) },
    text: entry.values.text !== entry.defaults.text ? entry.values.text : undefined }
}
export const usePersistedEditableText = import.meta.env.DEV ? useEditableTextDev : usePersistedText
