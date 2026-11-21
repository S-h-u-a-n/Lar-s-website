import { useMemo } from 'react'
import { usePersistedEditableText } from '../../dev/useEditableText'

function Editable({ id, children, as: Tag = 'span', ...props }) {
  const defaultValues = useMemo(() => ({ text: typeof children === 'string' ? children : undefined }), [children])
  const text = usePersistedEditableText({ id, label: `Main · ${id}`, defaultValues })
  return <Tag {...props} ref={text.ref} {...text.props}>{text.text ?? children}</Tag>
}

// Shared header/footer stay unchanged outside Main.
export default function Text({ enabled = true, as: Tag = 'span', id, children, ...props }) {
  return enabled ? <Editable id={id} as={Tag} {...props}>{children}</Editable> : <Tag {...props}>{children}</Tag>
}
