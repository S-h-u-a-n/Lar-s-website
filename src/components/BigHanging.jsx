import { useEffect, useRef } from 'react'
import bigHanging1Image from '../../Art/Big/Big-decoration/Big-hanging1.PNG'
import bigHanging2Image from '../../Art/Big/Big-decoration/Big-hanging2.PNG'

const HANGING_CONFIG = [
  { image: bigHanging1Image, className: 'big-hanging-one', duration: 8.6, phase: 0.4, amplitude: 0.72, retreatDelay: 20, retreatDuration: 560 },
  { image: bigHanging2Image, className: 'big-hanging-two', duration: 6.9, phase: 2.1, amplitude: 0.95, retreatDelay: 65, retreatDuration: 590 },
]

function BigHanging() {
  const imageRefs = useRef([])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let startedAt = performance.now()

    const reset = () => {
      imageRefs.current.forEach(image => {
        if (image) image.style.transform = 'translateX(-50%) rotate(0deg)'
      })
    }
    const render = now => {
      if (reducedMotion.matches) return
      const elapsed = (now - startedAt) / 1000
      HANGING_CONFIG.forEach((config, index) => {
        const image = imageRefs.current[index]
        if (!image) return
        const angle = Math.sin((elapsed / config.duration) * Math.PI * 2 + config.phase) * config.amplitude
        image.style.transform = `translateX(-50%) rotate(${angle}deg)`
      })
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

  return (
    <div className="big-hanging-layer" aria-hidden="true">
      {HANGING_CONFIG.map((config, index) => (
        <div
          key={config.className}
          className="big-hanging-retreat-wrapper"
          data-focus-retreat="up"
          data-focus-retreat-delay={config.retreatDelay}
          data-focus-retreat-duration={config.retreatDuration}
        >
          <img
            ref={element => { imageRefs.current[index] = element }}
            className={`big-hanging-image ${config.className}`}
            src={config.image}
            alt=""
          />
        </div>
      ))}
    </div>
  )
}

export default BigHanging
