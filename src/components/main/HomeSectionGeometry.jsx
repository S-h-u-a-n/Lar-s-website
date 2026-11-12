import './HomeHeroAtmosphere.css'
import './HomeSectionGeometry.css'

export default function HomeSectionGeometry({ variant }) {
  return <div className={`home-section-geometry home-section-geometry--${variant}`} aria-hidden="true">
    <div className="home-geometry-dots"/>
    <div className="home-geometry-stripes"/>
    <div className="home-geometry-grid"/>
  </div>
}
