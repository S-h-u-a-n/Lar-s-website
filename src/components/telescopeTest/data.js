import { PIGMENTS } from '../../edition/palette'
import { MOTION } from '../bigTest/config'
export const COLORS = { cream:PIGMENTS.paper, ink:PIGMENTS.ink, teal:PIGMENTS.mint, pink:PIGMENTS.strawberry, blue:PIGMENTS.sky, yellow:PIGMENTS.butter }
export const ANIMATION = { ...MOTION, focusDuration: 550 }
export const COLLECTION_KEY = 'genesis:telescope-test:collection:v1'
export const DIALOGUE = { welcome: 'Welcome, observer. Drag to explore and scroll to zoom.', tutorial: 'GLOBE shows the map. STREET currently opens satellite terrain; street-level imagery is not connected.', globe: 'The globe map is ready for your next discovery.', satellite: 'Satellite terrain selected. Street-level coverage is not available in this instrument yet.', active: 'Look closely. Even an ordinary place can become a remarkable field note.' }
