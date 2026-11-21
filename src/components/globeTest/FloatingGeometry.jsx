import { useRef } from 'react'
import useFloatingGeometry from './useFloatingGeometry'

const SQUARES = [
  { id: 'pink', className: 'gt-pink-square' },
  { id: 'yellow', className: 'gt-yellow-square' },
  { id: 'sky', style: { left: '47%', top: '19%', '--square-size': 'clamp(20px,2.1vw,32px)', '--square-color': 'var(--gt-blue)', '--square-angle': '-16deg' } },
  { id: 'mint', style: { right: '2.5%', top: '65%', '--square-size': 'clamp(24px,2.6vw,40px)', '--square-color': 'var(--gt-mint)', '--square-angle': '17deg' } },
  { id: 'peach', style: { left: '51%', bottom: '16%', '--square-size': 'clamp(18px,1.7vw,26px)', '--square-color': 'var(--gt-peach)', '--square-angle': '-9deg' } },
  { id: 'butter', style: { left: '59%', top: '10%', '--square-size': 'clamp(16px,1.5vw,23px)', '--square-color': 'var(--gt-yellow)', '--square-angle': '24deg' } },
  { id: 'rose', style: { left: '44%', bottom: '6%', '--square-size': 'clamp(17px,1.8vw,28px)', '--square-color': 'var(--gt-pink)', '--square-angle': '11deg' } },
]

export default function FloatingGeometry() {
  const root = useRef(null)
  useFloatingGeometry(root)
  return <div ref={root} className="gt-decor" aria-hidden="true">
    <i className="gt-disc" />
    <i className="gt-stripes gt-floating-square" data-floating-square="stripes" />
    <i className="gt-grid gt-floating-square" data-floating-square="grid" />
    {SQUARES.map(square => <i key={square.id} className={`gt-floating-square ${square.className || 'gt-extra-square'}`} data-floating-square={square.id} style={square.style} />)}
  </div>
}
