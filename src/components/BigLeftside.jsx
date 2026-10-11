import { useCallback, useEffect, useState } from 'react'
import LayoutEditor from '../dev/LayoutEditor'
import bigLeftsideReference from '../../reference/Big-leftside-reference.png'
import bigLetter3Image from '../../Art/Big/Big-leftside/Big-letter3.PNG'
import bigSticky3Image from '../../Art/Big/Big-leftside/Big-sticky3.PNG'
import bigSticky2Image from '../../Art/Big/Big-leftside/Big-sticky2.PNG'
import bigNote1Image from '../../Art/Big/Big-leftside/Big-note1.PNG'
import bigStickyImage from '../../Art/Big/Big-leftside/Big-sticky.PNG'
import bigLetter1Image from '../../Art/Big/Big-leftside/Big-letter1.PNG'
import bigLetter2Image from '../../Art/Big/Big-leftside/Big-letter2.PNG'
import bigSticky1Image from '../../Art/Big/Big-leftside/Big-sticky1.PNG'
import bigLetterOpen1Image from '../../Art/Big/Big-leftside/Big-letteropen1.PNG'
import bigPaper1Image from '../../Art/Big/Big-leftside/Big-paper1.PNG'
import bigBloodImage from '../../Art/Big/Big-leftside/Big-blood.PNG'
import bigLetterOpen2Image from '../../Art/Big/Big-leftside/Big-letteropen2.PNG'
import bigPaper2Image from '../../Art/Big/Big-leftside/Big-paper2.PNG'
import bigCard1Image from '../../Art/Big/Big-leftside/Big-card1.PNG'
import bigPaper3Image from '../../Art/Big/Big-leftside/Big-paper3.PNG'

const INITIAL_DOCUMENTS = [
  { id: 'letter3', src: bigLetter3Image, ratio: 1328 / 2106, x: -3.87, y: 4.31, width: 13.48, rotation: 256.97, zIndex: 8 },
  { id: 'sticky3', src: bigSticky3Image, ratio: 845 / 987, x: -9.82, y: 24, width: 16, rotation: -5, zIndex: 7 },
  { id: 'sticky2', src: bigSticky2Image, ratio: 1139 / 1341, x: -5.09, y: 24.96, width: 17.51, rotation: 8, zIndex: 5 },
  { id: 'note1', src: bigNote1Image, ratio: 1531 / 1246, x: -6.58, y: 41.81, width: 21.35, rotation: 7.89, zIndex: 6 },
  { id: 'sticky', src: bigStickyImage, ratio: 961 / 1131, x: -9, y: 58.77, width: 14, rotation: -15.42, zIndex: 5 },
  { id: 'letter1', src: bigLetter1Image, ratio: 1409 / 2072, x: 0.26, y: 46.37, width: 13.74, rotation: -79.41, zIndex: 4 },
  { id: 'letter2', src: bigLetter2Image, ratio: 1328 / 2106, x: -8.48, y: 62.42, width: 15.07, rotation: 262.2, zIndex: 3 },
  { id: 'sticky1', src: bigSticky1Image, ratio: 2048 / 1274, x: -10.46, y: 84.59, width: 26.73, rotation: -14.68, zIndex: 2 },
]

const INITIAL_LETTER1_EXPANDED = [
  { id: 'letteropen1', src: bigLetterOpen1Image, ratio: 1933 / 1909, x: 23.75, y: 29.34, width: 33.41, rotation: -6.24, zIndex: 1 },
  { id: 'paper1', src: bigPaper1Image, ratio: 2048 / 2466, x: 34.36, y: 10.7, width: 33.65, rotation: 4, zIndex: 2 },
  { id: 'blood', src: bigBloodImage, ratio: 944 / 1493, x: 61.14, y: 42.93, width: 11.94, rotation: 23.94, zIndex: 3 },
]

const INITIAL_LETTER2_EXPANDED = [
  { id: 'letteropen2', src: bigLetterOpen2Image, ratio: 1933 / 1909, x: 46.43, y: 23.72, width: 32.51, rotation: 38.08, zIndex: 1 },
  { id: 'paper2', src: bigPaper2Image, ratio: 2048 / 2466, x: 32.78, y: 12.76, width: 33.42, rotation: 2.39, zIndex: 2 },
  { id: 'card1', src: bigCard1Image, ratio: 1798 / 1350, x: 23.67, y: 52.34, width: 26.58, rotation: -16.7, zIndex: 3 },
]

const INITIAL_LETTER3_EXPANDED = [
  { id: 'letteropen2', src: bigLetterOpen2Image, ratio: 1933 / 1909, x: 25.12, y: 23.13, width: 32.74, rotation: 6.43, zIndex: 1 },
  { id: 'paper3', src: bigPaper3Image, ratio: 2048 / 2466, x: 32.63, y: 11.43, width: 34.73, rotation: 0, zIndex: 2 },
]

const INITIAL_STICKY3_EXPANDED = [
  { id: 'sticky3', src: bigSticky3Image, ratio: 845 / 987, x: 35.74, y: 20.7, width: 26.62, rotation: -87.91, zIndex: 1 },
]

const INITIAL_STICKY2_EXPANDED = [
  { id: 'sticky2', src: bigSticky2Image, ratio: 1139 / 1341, x: 38.35, y: 22.64, width: 27.1, rotation: 268.92, zIndex: 1 },
]

const INITIAL_STICKY_EXPANDED = [
  { id: 'sticky', src: bigStickyImage, ratio: 961 / 1131, x: 37.03, y: 25.42, width: 24, rotation: 267.45, zIndex: 1 },
]

const INITIAL_STICKY1_EXPANDED = [
  { id: 'sticky1', src: bigSticky1Image, ratio: 2048 / 1274, x: 26.94, y: 29.32, width: 45.1, rotation: 269.17, zIndex: 1 },
]

function ExpandedDocumentView({ layoutId, initialItems, onClose }) {
  const [items, setItems] = useState(initialItems)
  const [editorOpen, setEditorOpen] = useState(false)
  const updateItems = useCallback(nextItems => setItems(nextItems), [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('expanded-document-open', { detail: { open: true } }))
    const handleScope = event => {
      if (event.detail?.id === layoutId) setEditorOpen(Boolean(event.detail.open))
    }
    window.addEventListener('layout-editor-scope', handleScope)
    return () => {
      window.removeEventListener('layout-editor-scope', handleScope)
      window.dispatchEvent(new CustomEvent('expanded-document-open', { detail: { open: false } }))
    }
  }, [])

  return (
    <div className="expanded-document-view">
      <div className="expanded-document-backdrop" onClick={!editorOpen ? onClose : undefined} />
      <LayoutEditor
        items={items}
        initialItems={initialItems}
        onChange={updateItems}
        layoutId={layoutId}
        draftKey={layoutId}
        interactiveWhenClosed
        onItemActivate={() => {}}
      />
    </div>
  )
}

function BigLeftside() {
  const [items, setItems] = useState(INITIAL_DOCUMENTS)
  const [expandedId, setExpandedId] = useState(null)
  const updateItems = useCallback(nextItems => setItems(nextItems), [])

  return <>
    <div className="big-leftside-focus-retreat" data-focus-retreat="left" data-focus-retreat-duration="620">
      <LayoutEditor items={items} initialItems={INITIAL_DOCUMENTS} onChange={updateItems} referenceImage={bigLeftsideReference} draftKey="big-leftside" hoverEnabled defaultHoverOffsetX={100} onItemActivate={id => { if (id === 'letter1' || id === 'letter2' || id === 'letter3' || id === 'sticky3' || id === 'sticky2' || id === 'sticky' || id === 'sticky1') setExpandedId(id) }} />
    </div>
    {expandedId === 'letter1' && <ExpandedDocumentView layoutId="big-letter1-expanded" initialItems={INITIAL_LETTER1_EXPANDED} onClose={() => setExpandedId(null)} />}
    {expandedId === 'letter2' && <ExpandedDocumentView layoutId="big-letter2-expanded" initialItems={INITIAL_LETTER2_EXPANDED} onClose={() => setExpandedId(null)} />}
    {expandedId === 'letter3' && <ExpandedDocumentView layoutId="big-letter3-expanded" initialItems={INITIAL_LETTER3_EXPANDED} onClose={() => setExpandedId(null)} />}
    {expandedId === 'sticky3' && <ExpandedDocumentView layoutId="big-sticky3-expanded" initialItems={INITIAL_STICKY3_EXPANDED} onClose={() => setExpandedId(null)} />}
    {expandedId === 'sticky2' && <ExpandedDocumentView layoutId="big-sticky2-expanded" initialItems={INITIAL_STICKY2_EXPANDED} onClose={() => setExpandedId(null)} />}
    {expandedId === 'sticky' && <ExpandedDocumentView layoutId="big-sticky-expanded" initialItems={INITIAL_STICKY_EXPANDED} onClose={() => setExpandedId(null)} />}
    {expandedId === 'sticky1' && <ExpandedDocumentView layoutId="big-sticky1-expanded" initialItems={INITIAL_STICKY1_EXPANDED} onClose={() => setExpandedId(null)} />}
  </>
}

export default BigLeftside
