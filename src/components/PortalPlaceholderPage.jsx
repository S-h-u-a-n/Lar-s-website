import PortalBackButton from './PortalBackButton'
import './GlobePage.css'

function PortalPlaceholderPage({ onBack }) {
  return (
    <main className="globe-page portal-placeholder-page">
      <PortalBackButton onBack={onBack} />
    </main>
  )
}

export default PortalPlaceholderPage