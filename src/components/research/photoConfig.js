import commonsPhotos from './commonsPhotos.json'

// Page -> stable topic ID -> local image, alt text and verified Commons credit.
// Keep a missing topic absent so its original empty photo area remains intact.
export const RESEARCH_PHOTOS = commonsPhotos

export function withResearchPhoto(page, article) {
  const photo = RESEARCH_PHOTOS[page]?.[article.id]
  return photo ? { ...article, image: photo.image, imageAlt: photo.imageAlt ?? article.imageAlt, photoCredit: photo.photoCredit } : article
}
