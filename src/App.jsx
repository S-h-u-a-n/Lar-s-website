import { useState } from 'react'
import IntroScreen from './components/IntroScreen'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import ExploreSection from './components/ExploreSection'
import Footer from './components/Footer'

function App() {
  const [isIntroVisible, setIsIntroVisible] = useState(true)

  return (
    <div className="site-shell">
      {isIntroVisible && <IntroScreen onEnter={() => setIsIntroVisible(false)} />}
      <Header />
      <main className={isIntroVisible ? 'home-content is-waiting' : 'home-content'}>
        <HeroSection />
        <ExploreSection />
      </main>
      <Footer />
    </div>
  )
}

export default App