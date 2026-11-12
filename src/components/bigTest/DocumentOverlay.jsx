import { createPortal } from 'react-dom'

// The scene scrim blurs the canvas. Only the panel escapes the scene's stacking
// context, so it sits above the separate left navigation without blurring chrome.
export default function DocumentOverlay({ id, active, onClose, children }) {
  const className = `big-test-document-overlay${active ? ' is-open' : ''}`
  return <section data-dev-scope={import.meta.env.DEV ? `document-${id}` : undefined} className={className} inert={!active} aria-hidden={!active}>
    <div className="big-test-document-scrim" onClick={onClose} />
    {createPortal(<div className={`big-test-artboard big-test-document-floating ${className}`} inert={!active} aria-hidden={!active}>{children}</div>, document.body)}
  </section>
}
