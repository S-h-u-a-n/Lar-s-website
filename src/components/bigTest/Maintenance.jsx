import { useState } from 'react'
import round from '../../../Art/Big/Big-decoration/Big-round1.PNG'
import { MAINTENANCE } from './config'
import AssetCrop from './AssetCrop'
import EditableText from './EditableText'

export default function Maintenance() {
  const [isMaintenanceExpanded, setIsMaintenanceExpanded] = useState(false)
  return <aside className="big-test-maintenance">
    {MAINTENANCE.map(item => <button key={item.id} type="button" className={`big-test-maintenance-item${isMaintenanceExpanded ? ' is-expanded' : ''}`} aria-expanded={isMaintenanceExpanded} onClick={() => setIsMaintenanceExpanded(current => !current)}>
      <div className="big-test-maintenance-reveal"><EditableText id={`maintenance-${item.id}`}>{item.name}</EditableText></div>
      <div className="big-test-maintenance-dot"><AssetCrop src={round} crop={{ x: 526, y: 140, width: 990, height: 990 }} tint={item.color} /></div>
    </button>)}
  </aside>
}
