import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import './CircularReveal.css'

const REVEAL_DURATION_SECONDS = 0.95
const REVEAL_EASING = [0.22, 1, 0.36, 1]

function CircularReveal({ origin, isRevealing, onRevealComplete, children }) {
  const reduced=useReducedMotion()
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const updateViewport = () => setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    })
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  const originX = origin
    ? (origin.x / (origin.viewportWidth || viewport.width)) * viewport.width
    : viewport.width / 2
  const originY = origin
    ? (origin.y / (origin.viewportHeight || viewport.height)) * viewport.height
    : viewport.height / 2
  const coverRadius = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(viewport.width - originX, originY),
    Math.hypot(originX, viewport.height - originY),
    Math.hypot(viewport.width - originX, viewport.height - originY),
  ) + 2
  const closedClip = `circle(0px at ${originX}px ${originY}px)`
  const openClip = `circle(${coverRadius}px at ${originX}px ${originY}px)`

  return createPortal(
    <motion.div
      className="circular-reveal"
      initial={isRevealing ? { clipPath: closedClip } : false}
      animate={{ clipPath: openClip }}
      transition={{
        duration: isRevealing && !reduced ? REVEAL_DURATION_SECONDS : 0,
        ease: REVEAL_EASING,
      }}
      onAnimationComplete={isRevealing ? onRevealComplete : undefined}
    >
      {children}
    </motion.div>,
    document.body,
  )
}

export default CircularReveal