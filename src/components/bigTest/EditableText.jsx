import { usePersistedEditableText } from '../../dev/useEditableText'

export default function EditableText({ id, children, as: Tag = 'span', className, htmlId }) {
  const text = usePersistedEditableText({ id: `big-test-${id}`, label: `BigTest · ${id}` })
  return <Tag ref={text.ref} {...text.props} id={htmlId} className={className}>{text.text ?? children}</Tag>
}
