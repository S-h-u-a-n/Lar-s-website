import squares from '../../../Art/Big/Big-decoration/Big-squares.PNG'
import AssetCrop from './AssetCrop'
import { SQUARES, floatingStyle, focusStyle } from './config'

export default function FloatingSquares() {
  return <div className="big-test-artboard big-test-decoration-squares" aria-hidden="true">
    <div className="big-test-focus-motion" style={focusStyle('squares')}>{SQUARES.map((square, index) => <div key={square.id} className="big-test-small-square" style={{ left: `${square.x / 20.48}%`, top: `${square.y / 11.7}%`, width: `${square.width / 20.48}%`, height: `${square.height / 11.7}%` }}>
      <div className="big-test-float" style={floatingStyle(index)}><AssetCrop src={squares} crop={square} /></div>
    </div>)}</div>
  </div>
}
