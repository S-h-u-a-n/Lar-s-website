import { useLayoutEffect, useRef } from 'react'
import ResearchPhoto from './ResearchPhoto'
import PhotoCredit from './PhotoCredit'

// A category-local sibling follows the selected label's measured height.
export default function ReadingPhoto({ entry, content }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const node = ref.current
    const card = node.parentElement.querySelector(`[data-entry-id="${entry.id}"]`)
    if (!card) return
    const place = () => { node.style.top = `${entry.y + card.offsetHeight + 28}px` }
    const observer = new ResizeObserver(place)
    observer.observe(card)
    place()
    return () => observer.disconnect()
  }, [entry])
  return <div ref={ref} data-entry-photo={entry.id} className="nt-reading-photo" style={{ left: entry.x - 35, top: entry.y + 218 }}>
    <ResearchPhoto content={content}/>
    {content?.image && content.photoCredit && <PhotoCredit key={entry.id} photoRef={ref} credit={content.photoCredit}/>}
  </div>
}
