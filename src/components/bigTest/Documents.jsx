import { useEffect, useRef, useState } from 'react'
import { markEarthExplored } from './earthExplorationStore'
import { DOCUMENTS, DOCUMENT_ENTRANCES, documentPanelTheme, GEOMETRY, PANEL_PATTERN, documentFloatingStyle } from './config'
import { patternStyle } from './Background'
import DocumentOverlay from './DocumentOverlay'
import EditableText from './EditableText'
import LetterPanel from './LetterPanel'
import ResearchLogPanel from './ResearchLogPanel'
import { LETTERS, NOTES, RESEARCH_LOGS } from './letters'

function DocumentPanel({ document, active, onClose, theme }) {
  const closeRef = useRef(null)
  const previousFocus = useRef(null)
  useEffect(() => {
    if (!active) return
    previousFocus.current = window.document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    const keydown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') { event.preventDefault(); closeRef.current?.focus() }
    }
    window.addEventListener('keydown', keydown)
    return () => { window.removeEventListener('keydown', keydown); previousFocus.current?.focus?.({ preventScroll: true }) }
  }, [active, onClose])
  return <DocumentOverlay id={document.id} active={active} onClose={onClose}>
    <div className="big-test-document-panel" role="dialog" aria-modal="true" aria-labelledby={`big-test-document-title-${document.id}`}>
      <div className="big-test-document-cover" style={{ backgroundColor: theme.cover }}><span className="big-test-document-white-square" aria-hidden="true"/><div className="big-test-document-dots" style={patternStyle({ ...PANEL_PATTERN, patternColor: theme.dots })} /></div>
      <div className="big-test-document-copy">
        <EditableText id={`document-title-${document.id}`} as="h2" htmlId={`big-test-document-title-${document.id}`}>{document.title}</EditableText>
        <EditableText id={`document-body-${document.id}`} as="p">{document.body}</EditableText>
        <button ref={closeRef} type="button" onClick={onClose}><EditableText id={`document-close-${document.id}`}>Close</EditableText></button>
      </div>
    </div>
  </DocumentOverlay>
}

export default function Documents({ onOpen }) {
  const [activeId, setActiveId] = useState(null)
  const close = useRef(() => setActiveId(null)).current
  useEffect(()=>{const open=event=>{if(DOCUMENTS.some(document=>document.id===event.detail?.id)){onOpen?.();setActiveId(event.detail.id)}};window.addEventListener('edition-open-document',open);return()=>window.removeEventListener('edition-open-document',open)},[onOpen])
  useEffect(() => {
    if (activeId) markEarthExplored(activeId)
    window.dispatchEvent(new CustomEvent('expanded-document-open', { detail: { open: Boolean(activeId) } }))
    return () => window.dispatchEvent(new CustomEvent('expanded-document-open', { detail: { open: false } }))
  }, [activeId])
  return <>
    <div className="big-test-document-entrances">
      {DOCUMENT_ENTRANCES.map((entrance, index) => {
        const shape = GEOMETRY.find(item => item.id === entrance.shapeId)
        const document = DOCUMENTS.find(item => item.id === entrance.document)
        return <button key={shape.id} type="button" className="big-test-square" data-dev-scope={import.meta.env.DEV ? `document-entrance-${document.id}` : undefined} data-document-entrance={document.id} style={{ left: `${shape.x / 20.48}%`, top: `${shape.y / 11.7}%`, width: `${shape.width / 20.48}%`, aspectRatio: '1 / 1', '--bt-rotation': `${shape.rotation ?? 0}deg`, zIndex: shape.z ?? 1 }} onClick={() => { onOpen?.(); setActiveId(document.id) }}>
          <span className="big-test-label-animation big-test-float" style={documentFloatingStyle(index)}><span className="big-test-square-label"><EditableText id={entrance.textId}>{document.name}</EditableText></span></span>
        </button>
      })}
    </div>
    {DOCUMENTS.map(document => {
      if (document.id === 'letter' && LETTERS.length) {
        return <LetterPanel key={document.id} active={activeId === document.id} onClose={close} entries={LETTERS} category="letter" />
      }
      if (document.id === 'notes' && NOTES.length) {
        return <LetterPanel key={document.id} active={activeId === document.id} onClose={close} entries={NOTES} category="notes" />
      }
      if (document.id === 'diary' && RESEARCH_LOGS.length) {
        return <ResearchLogPanel key={document.id} active={activeId === document.id} onClose={close} entries={RESEARCH_LOGS} />
      }
      return <DocumentPanel key={document.id} document={document} active={activeId === document.id} onClose={close} theme={documentPanelTheme(document.id)} />
    })}
  </>
}
