import { useEffect, useRef } from 'react'
import { useRegisterDevEditor } from './devEditorStore'
import { buildTextStyle, registerText, unregisterText, useTextEditorState } from './textEditorStore'

const PROD_RESULT = { ref: null, props: {}, text: undefined }

// Usage: <p ref={t.ref} {...t.props}>{t.text ?? originalChildren}</p>. Production returns inert values.
function useEditableTextDev({ id, label, coordinateSpace, defaultValues, sourceRevision, sourceRevisionStrategy, sourceDefaultKeys, forceDefaultKeys }) {
  const ref = useRef(null)
  useRegisterDevEditor('text', id)
  useEffect(() => {
    registerText(id, label, ref.current, 'registered', { coordinateSpace, defaultValues, sourceRevision, sourceRevisionStrategy, sourceDefaultKeys, forceDefaultKeys })
    return () => unregisterText(id)
  }, [id, label, coordinateSpace, defaultValues, sourceRevision, sourceRevisionStrategy, sourceDefaultKeys, forceDefaultKeys])

  const entry = useTextEditorState().data[id]
  const props = { 'data-text-editor-id': id }
  if (!entry) return { ref, props, text: undefined, defaultText: defaultValues?.text }
  props.style = buildTextStyle(entry)
  return { ref, props, text: entry.values.text !== entry.defaults.text ? entry.values.text : undefined, defaultText: entry.defaults.text }
}

export const useEditableText = import.meta.env.DEV ? useEditableTextDev : () => PROD_RESULT

// Opt-in read-only production rendering; leaves other pages' text behavior unchanged.
function usePersistedText({ id, defaultValues, sourceRevision, sourceRevisionStrategy, sourceDefaultKeys, forceDefaultKeys }) {
  const entry = useTextEditorState().data[id]
  if (!entry) return PROD_RESULT
  if (sourceRevision && entry.sourceRevision !== sourceRevision) {
    let values
    if (sourceRevisionStrategy === 'replace') {
      values = { ...defaultValues }
    } else if (sourceRevisionStrategy === 'preserve-edits') {
      values = { ...defaultValues }
      Object.entries(entry.values).forEach(([key, value]) => {
        if (entry.defaults?.[key] !== value) values[key] = value
      })
      forceDefaultKeys?.forEach(key => { values[key] = defaultValues[key] })
    } else {
      values = { ...entry.values, ...defaultValues }
    }
    return {
      ref: null,
      props: { style: buildTextStyle({ ...entry, sourceDefaultKeys: sourceDefaultKeys ?? entry.sourceDefaultKeys, values }) },
      text: values.text !== defaultValues.text ? values.text : undefined,
    }
  }
  return { ref: null, props: { style: buildTextStyle(entry) },
    text: entry.values.text !== entry.defaults.text ? entry.values.text : undefined }
}
export const usePersistedEditableText = import.meta.env.DEV ? useEditableTextDev : usePersistedText
