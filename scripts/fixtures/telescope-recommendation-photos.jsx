// Isolated browser QA: renders the production cards and credit dialog without map services.
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RecommendationCard } from '../../src/components/telescopeTest/TelescopeTest'
import { RECOMMENDATIONS } from '../../src/components/telescopeTest/observations'
import '../../src/styles.css'
import '../../src/edition/edition.css'

function PhotoCheck() {
  const [selected, setSelected] = useState(null)
  return <div className="telescope-test"><div className="tt-log-layer is-open"><aside className="tt-drawer" aria-label="推薦照片檢查">
    <h2>大家推薦</h2>
    {RECOMMENDATIONS.map(place => <RecommendationCard key={place.id} place={place} selected={selected === place.id} canVisit onVisit={() => setSelected(place.id)} onOpenCharacter={() => {}}/>)}
  </aside></div></div>
}
createRoot(document.getElementById('root')).render(<PhotoCheck/> )
