import profiles from './characterProfiles.json'

// The filename (without extension) is the stable character ID. No fixed count.
const images = import.meta.glob('/Art/avatar/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP,AVIF,GIF}', {
  eager: true, query: '?url', import: 'default',
})

export const characters = Object.entries(images).sort(([a], [b]) => a.localeCompare(b, 'zh-Hant')).map(([path, image]) => {
  const id = path.split('/').at(-1).replace(/\.[^.]+$/, '')
  return { id, name: id, age: '', affiliation: '', specialties: [], projects: [], biography: '', ...profiles[id], image }
})

export function loadCharacters() {
  return Promise.all(characters.map(character => new Promise(resolve => {
    const image = new Image()
    image.onload = () => resolve(character)
    image.onerror = () => { console.warn(`Character portrait could not load: ${character.id}`); resolve(null) }
    image.src = character.image
  }))).then(results => results.filter(Boolean))
}
