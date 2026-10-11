import GlobeViewer from './GlobeViewer'
import PortalBackButton from './PortalBackButton'
import './GlobePage.css'

function GlobePage({ onBack }) {
  return (
    <main className="globe-page">
      <PortalBackButton onBack={onBack} />
      <section className="globe-viewer-region" aria-label="Globe viewer">
        <GlobeViewer />
      </section>
      <section className="globe-empty-region" aria-hidden="true" />
    </main>
  )
}

export default GlobePage