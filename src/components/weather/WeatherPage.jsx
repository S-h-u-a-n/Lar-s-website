import WeatherPotions from '../../dev/weatherPotions/WeatherPotions'
import '../../dev/weatherPotions/WeatherPotions.css'

// A normal portal destination; the existing App owns navigation and transitions.
export default function WeatherPage({ onBack, onHome, onReady }) {
  return <WeatherPotions onBack={onBack} onHome={onHome} onReady={onReady} />
}
