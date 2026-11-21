import { useRef } from 'react'
import ResearchPhoto from './ResearchPhoto'
import PhotoCredit from './PhotoCredit'

// Keep the existing image and attribution inside the article's scroll container.
export default function ReadingPhoto({ content }) {
  const ref = useRef(null)
  if (!content?.image) return null
  return <div ref={ref} className="nt-article-photo" data-photo-credit={content.photoCredit ? "" : undefined} onClick={() => { if (content.photoCredit) ref.current?.querySelector(".research-photo-info")?.click() }}>
    <ResearchPhoto content={content}/>
    {content.photoCredit && <PhotoCredit photoRef={ref} credit={content.photoCredit} inline/>}
  </div>
}
