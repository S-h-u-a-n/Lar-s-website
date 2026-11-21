import { useEffect } from 'react'
import { usePersistedEditableText } from '../../dev/useEditableText'
import { buildTextStyle, enablePageTextPersistence } from '../../dev/textEditorStore'
import config from './homeTextConfig.json'

const records = Object.fromEntries(Object.entries(config.registered).map(([id, values]) => {
  const defaults = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== null && !['selector', 'coordinateSpace'].includes(key)))
  return [id, { defaults, style: buildTextStyle({ type: 'registered', defaults, values: defaults, sourceDefaultKeys: Object.keys(defaults) }) }]
}))

export const homeTextIdForSelector = selector => Object.entries(config.registered).find(([, value]) => value.selector === selector)?.[0]

export function HomePublishedTextPersistence() {
  useEffect(() => {
    if (!import.meta.env.DEV) return enablePageTextPersistence('home', 'home-', { readOnly: true })
  }, [])
  return null
}

// Native elements keep their handlers and child artwork. Revision-scoped IDs
// leave existing browser drafts intact without overriding published defaults.
export default function HomePublishedText({ as: Tag = 'span', configId, children, before, after, style, ...props }) {
  const record = records[configId]
  const editable = usePersistedEditableText({ id: `home-published-20261027-${configId}`,
    label: `Home / ${configId}`, defaultValues: record.defaults })
  return <Tag {...props} ref={editable.ref} {...editable.props} data-home-config-id={configId}
    style={{ ...style, ...record.style, ...editable.props.style, whiteSpace: 'pre-wrap' }}>
    {before}{editable.text ?? record.defaults.text}{after}
  </Tag>
}
