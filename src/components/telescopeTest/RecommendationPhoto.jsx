import { useRef, useState } from 'react'
import PhotoCredit from '../research/PhotoCredit'
import { photoUrl } from '../research/photoUrl.js'
import photos from './recommendationPhotos.json'

export default function RecommendationPhoto({ place }) {
  const photo = photos[place.id]
  const frame = useRef(null)
  const [loadedPhotoPath, setLoadedPhotoPath] = useState('')
  const loaded = loadedPhotoPath === place.photoPath
  return <>
    <div ref={frame} className="tt-recommendation-photo" aria-label={`${place.locationName}照片展示區`} data-photo-loaded={loaded} data-photo-available={Boolean(photo)}>
      {!loaded && <><span aria-hidden="true">✦</span><p>地點照片預留區</p></>}
      {photo && <img src={photoUrl(place.photoPath)} alt={photo.imageAlt} width={photo.photoCredit.width} height={photo.photoCredit.height} aria-hidden={!loaded} loading="lazy" decoding="async" onLoad={() => setLoadedPhotoPath(place.photoPath)} onError={() => setLoadedPhotoPath('')} />}
      {photo && <PhotoCredit photoRef={frame} credit={photo.photoCredit} inline/>}
    </div>
    {photo?.note && <p className="tt-recommendation-photo-note">{photo.note}</p>}
  </>
}
