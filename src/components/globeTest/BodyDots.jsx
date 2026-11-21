import AssetCrop from '../bigTest/AssetCrop'
import round from '../../../Art/Big/Big-decoration/Big-round1.PNG'
import { MAINTENANCE, MOTION } from '../bigTest/config'

const SHORTCUTS = [['earth', '地球'], ['moon', '月球'], ['sun', '太陽']]

// Reuse Big's original round pixels, crop, tint palette and transition timing.
// Home's swatches supply the existing 19px–32px visible-dot sizing in CSS.
export default function BodyDots({ ready, selected, onSelect }) {
  return <div className="gt-body-dots" role="group" aria-label="天體切換" style={{ '--gt-dot-duration': `${MOTION.duration}ms`, '--gt-dot-easing': MOTION.easing }}>
    {SHORTCUTS.map(([id, name], index) => <button type="button" className="gt-body-dot" key={id} aria-label={name} title={name} aria-pressed={selected === id} disabled={!ready} onClick={() => onSelect(id)}>
      <AssetCrop src={round} crop={{ x: 526, y: 140, width: 990, height: 990 }} tint={MAINTENANCE[index].color} />
    </button>)}
    {MAINTENANCE.slice(3).map(item => <span key={item.id} className="gt-body-dot gt-body-dot-decoration" aria-hidden="true">
      <AssetCrop src={round} crop={{ x: 526, y: 140, width: 990, height: 990 }} tint={item.color} />
    </span>)}
  </div>
}
