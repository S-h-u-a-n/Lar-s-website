import round from '../../../Art/Big/Big-decoration/Big-round1.PNG'
import grid from '../../../Art/Big/Big-decoration/Big-grid.png'
import { GEOMETRY, PATTERN_DEFAULTS, DOCUMENT_ENTRANCES, DOCUMENTS, documentFloatingStyle, focusStyle } from './config'

export function patternStyle(shape) {
  const spacing = shape.spacing ?? PATTERN_DEFAULTS.spacing
  const thickness = shape.thickness ?? PATTERN_DEFAULTS.thickness
  const color = shape.patternColor ?? PATTERN_DEFAULTS.color
  if (shape.pattern === 'dots') return { backgroundImage: `radial-gradient(circle, ${color} ${thickness}px, transparent ${thickness}px)`, backgroundSize: `${spacing}px ${spacing}px` }
  if (shape.pattern === 'grid') return { backgroundImage: `linear-gradient(${color} ${thickness}px, transparent ${thickness}px),linear-gradient(90deg, ${color} ${thickness}px, transparent ${thickness}px)`, backgroundSize: `${spacing}px ${spacing}px` }
  if (shape.pattern === 'stripes') return { backgroundImage: `repeating-linear-gradient(${shape.angle ?? PATTERN_DEFAULTS.angle}deg, transparent 0 ${spacing - thickness}px, ${color} ${spacing - thickness}px ${spacing}px)` }
  return {}
}

export default function Background() {
  return <div className="big-test-background" aria-hidden="true">
    <div className="big-test-focus-motion" data-focus-decoration="round" style={focusStyle('round')}><img className="big-test-full-art" src={round} alt="" /></div>
    <div className="big-test-focus-motion" data-focus-decoration="grid" style={focusStyle('grid')}><img className="big-test-full-art" src={grid} alt="" /></div>
    {GEOMETRY.filter(shape => shape.id !== 'title').map(shape => {
      const entrance = DOCUMENT_ENTRANCES.find(item => item.shapeId === shape.id)
      const document = DOCUMENTS.find(item => item.id === entrance?.document)
      return <div data-dev-layout={import.meta.env.DEV ? shape.id : undefined} key={shape.id} className="big-test-shape-position" style={{ left: `${shape.x / 20.48}%`, top: `${shape.y / 11.7}%`, width: `${shape.width / 20.48}%`, ...(entrance ? { aspectRatio: '1 / 1' } : { height: `${shape.height / 11.7}%` }), opacity: shape.opacity ?? 1, zIndex: shape.z ?? 1 }}>
        <div className={entrance ? 'big-test-float' : 'big-test-shape-static'} style={entrance ? documentFloatingStyle(DOCUMENT_ENTRANCES.indexOf(entrance)) : undefined}>
          <div className="big-test-background-shape" data-document-geometry={entrance?.document} style={{ '--bt-rotation': `${shape.rotation ?? 0}deg`, '--bt-shape-color': shape.color, '--bt-hover-color': document?.hoverColor, clipPath: shape.polygon, ...patternStyle(shape) }} />
        </div>
      </div>
    })}
  </div>
}
