import { useEffect, useRef } from 'react'
import bigSquaresImage from '../../Art/Big/Big-decoration/Big-squares.PNG'

const DURATION = 8.5
const AMPLITUDE_X = 3.5
const AMPLITUDE_Y = 2.2
const ROTATION = 0.15

function BigSquares() {
  const imageRef = useRef(null)

  useEffect(() => {
    const image = imageRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let startedAt = performance.now()

    const reset = () => {
      image.style.transform = 'translate3d(0, 0, 0) rotate(0deg)'
    }
    const render = now => {
      if (reducedMotion.matches) return
      const progress = ((now - startedAt) / 1000 / DURATION) * Math.PI * 2
      const x = Math.sin(progress) * AMPLITUDE_X
      const y = Math.sin(progress * 0.83 + 1.1) * AMPLITUDE_Y
      const rotation = Math.sin(progress * 0.71 + 0.6) * ROTATION
      image.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`
      frame = requestAnimationFrame(render)
    }
    const start = () => {
      cancelAnimationFrame(frame)
      if (reducedMotion.matches) {
        reset()
        return
      }
      startedAt = performance.now()
      frame = requestAnimationFrame(render)
    }
    const handleMotionPreference = () => start()

    reducedMotion.addEventListener('change', handleMotionPreference)
    start()

    return () => {
      cancelAnimationFrame(frame)
      reducedMotion.removeEventListener('change', handleMotionPreference)
      reset()
    }
  }, [])

  return <img ref={imageRef} className="big-foundation-squares" src={bigSquaresImage} alt="" />
}

export default BigSquares
