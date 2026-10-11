/*
 * Curve transition adapted from:
 * Awwwards Framer Motion Page Transitions
 * https://github.com/rashsvr/Awwwards-Framer-motion-page-transitions
 * Licensed under the MIT License.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import './CurveTransition.css'

const anim = (variants) => ({
  variants,
  initial: 'initial',
  animate: 'enter',
  exit: 'exit',
})

const curve = (initialPath, targetPath) => ({
  initial: {
    d: initialPath,
  },
  ready: {
    d: targetPath,
  },
  enter: {
    d: targetPath,
    transition: {
      duration: 0.75,
      delay: 0.35,
      ease: [0.76, 0, 0.24, 1],
    },
  },
  exit: {
    d: initialPath,
    transition: {
      duration: 0.75,
      ease: [0.76, 0, 0.24, 1],
    },
  },
})

const translate = {
  initial: {
    top: '-300px',
  },
  ready: {
    top: '100vh',
  },
  enter: {
    top: '-100vh',
    transition: {
      duration: 0.75,
      delay: 0.35,
      ease: [0.76, 0, 0.24, 1],
    },
    transitionEnd: {
      top: '100vh',
    },
  },
  exit: {
    top: '-300px',
    transition: {
      duration: 0.75,
      ease: [0.76, 0, 0.24, 1],
    },
  },
}

export default function CurveTransition({ phase, onAnimationComplete }) {
  const [dimensions, setDimensions] = useState({ width: null, height: null })

  useEffect(() => {
    function resize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const { width, height } = dimensions
  const initialPath = width == null
    ? ''
    : `M0 300 Q${width / 2} 0 ${width} 300 L${width} ${height + 300} Q${width / 2} ${height + 600} 0 ${height + 300} L0 0`
  const targetPath = width == null
    ? ''
    : `M0 300 Q${width / 2} 0 ${width} 300 L${width} ${height} Q${width / 2} ${height} 0 ${height} L0 0`

  return (
    <div className="curve-test-overlay" aria-hidden="true">
      <div className="background" style={{ opacity: width == null ? 1 : 0 }} />
      {width != null && (
        <motion.svg
          {...anim(translate)}
          initial={false}
          animate={phase}
          onAnimationComplete={onAnimationComplete}
          viewBox={`0 0 ${width} ${height + 600}`}
          preserveAspectRatio="none"
        >
          <motion.path
            {...anim(curve(initialPath, targetPath))}
            initial={false}
            animate={phase}
          />
        </motion.svg>
      )}
    </div>
  )
}