import './ResearchPhoto.css'

// Both research atlases use the article image; empty slots contain no UI text.
export default function ResearchPhoto({ content, className = '' }) {
  return <span className={`research-photo ${className}`} aria-hidden={content?.image ? undefined : true}>
    {content?.image && <img src={content.image} alt={content.imageAlt || content.chineseName || ''} width={content.photoCredit?.width} height={content.photoCredit?.height} loading="lazy" decoding="async" draggable="false"/>}
  </span>
}
