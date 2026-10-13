import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../styles.css'
import '../../edition/edition.css'
import '../../edition/round2.css'
import './WeatherPotions.css'
import WeatherPotions from './WeatherPotions'

const root = createRoot(document.getElementById('weather-potions-root'))
root.render(<StrictMode><WeatherPotions /></StrictMode>)
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount())
