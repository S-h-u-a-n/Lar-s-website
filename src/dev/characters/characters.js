import profiles from './characterProfiles.json'

// The filename (without extension) is the stable character ID. No fixed count.
const images = import.meta.glob('/Art/avatar/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP,AVIF,GIF}', {
  eager: true, query: '?url', import: 'default',
})

const orderedCharacters = Object.entries(images).sort(([a], [b]) => a.localeCompare(b, 'zh-Hant')).map(([path, image]) => {
  const id = path.split('/').at(-1).replace(/\.[^.]+$/, '')
  return { id, name: id, age: '', affiliation: '', specialties: [], projects: [], biography: '', ...profiles[id], image }
})

const yitiIndex = orderedCharacters.findIndex(character => character.id === '衵依')
const yierIndex = orderedCharacters.findIndex(character => character.id === '伊爾')
if (yitiIndex !== -1 && yierIndex !== -1) {
  const [yiti] = orderedCharacters.splice(yitiIndex, 1)
  orderedCharacters.splice(orderedCharacters.findIndex(character => character.id === '伊爾') + 1, 0, yiti)
}

export const characters = orderedCharacters

export function loadCharacters() {
  return Promise.all(characters.map(character => new Promise(resolve => {
    const image = new Image()
    image.onload = () => resolve(character)
    image.onerror = () => { console.warn(`Character portrait could not load: ${character.id}`); resolve(null) }
    image.src = character.image
  }))).then(results => results.filter(Boolean))
}
