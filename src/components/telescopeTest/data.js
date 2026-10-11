import { PIGMENTS } from '../../edition/palette'
import { MOTION } from '../bigTest/config'
export const COLORS = { cream:PIGMENTS.paper, ink:PIGMENTS.ink, teal:PIGMENTS.mint, pink:PIGMENTS.strawberry, blue:PIGMENTS.sky, yellow:PIGMENTS.butter }
export const ANIMATION = { ...MOTION, focusDuration: 550 }
export const COLLECTION_KEY = 'genesis:telescope-test:collection:v1'
export const SCHOOL_RECORDS = [
  { id: 'taipei', name: 'A city of quiet discoveries', longitude: 121.5654, latitude: 25.033, author: 'Mira', description: 'Follow the river through Taipei. Our field notes begin where the city meets the mountains.', illustration: null },
  { id: 'greenwich', name: 'The starting line', longitude: 0, latitude: 51.4779, author: 'Theo', description: 'A visit to Greenwich: a small line with a very large role in measuring the world.', illustration: null },
  { id: 'atacama', name: 'Under a clear sky', longitude: -68.21, latitude: -23.02, author: 'Mira', description: 'Explore the dry landscape near San Pedro de Atacama. A future illustration will record our night of observations.', illustration: null },
]
export const DIALOGUE = { welcome: 'Welcome, observer. Drag to explore and scroll to zoom.', tutorial: 'GLOBE shows the map. STREET currently opens satellite terrain; street-level imagery is not connected.', globe: 'The globe map is ready for your next discovery.', satellite: 'Satellite terrain selected. Street-level coverage is not available in this instrument yet.', active: 'Look closely. Even an ordinary place can become a remarkable field note.' }
