import { useMemo } from 'react'
import { usePersistedEditableText } from '../../dev/useEditableText'
export default function Text({ id, children, as: Tag = 'span', htmlId, ...rest }) {
  const defaultValues = useMemo(() => ({ text: String(children ?? '') }), [children])
  const text = usePersistedEditableText({ id: `globe-test-${id}`, label: `GlobeTest · ${id}`, defaultValues })
  return <Tag id={htmlId} {...rest} ref={text.ref} {...text.props}>{text.text ?? children}</Tag>
}
