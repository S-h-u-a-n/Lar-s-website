/*
 * Curve transition adapted from:
 * Awwwards Framer Motion Page Transitions
 * https://github.com/rashsvr/Awwwards-Framer-motion-page-transitions
 * Licensed under the MIT License.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import './CurveTransition.css'
import { MOTION } from '../edition/config'
import { PORTAL_TRANSITION_LAYOUT } from './portalComics/config'

const curve = (initialPath, targetPath) => ({
  idle: {
    d: targetPath,
  },
  covering: {
    d: initialPath,
    transition: {
      duration: MOTION.travel,
      ease: [0.76, 0, 0.24, 1],
    },
  },
  covered: {
    d: initialPath,
  },
  revealing: {
    d: targetPath,
    transition: {
      duration: MOTION.travel,
      delay: MOTION.travelRevealDelay,
      ease: [0.76, 0, 0.24, 1],
    },
  },
})

const translate = {
  idle: {
    top: '100vh',
  },
  covering: {
    top: '-300px',
    transition: {
      duration: MOTION.travel,
      ease: [0.76, 0, 0.24, 1],
    },
  },
  covered: {
    top: '-300px',
  },
  revealing: {
    top: '-100vh',
    transition: {
      duration: MOTION.travel,
      delay: MOTION.travelRevealDelay,
      ease: [0.76, 0, 0.24, 1],
    },
    transitionEnd: {
      top: '100vh',
    },
  },
}

export default function CurveTransition({ phase, onAnimationComplete, theme }) {
  const reduced=useReducedMotion()
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

  const layout = PORTAL_TRANSITION_LAYOUT
  const size = Math.min(layout.maxSize, Math.max(layout.minSize, Math.min(width || 0, height || 0) * layout.viewportRatio))
  const iconSize = size * layout.iconRatio

  return createPortal(
    <div
      className="curve-transition-overlay"
      data-transition-phase={phase}
      data-transition-background={theme?.background}
      data-transition-square={theme?.squareColor}
      aria-hidden="true"
      style={{ pointerEvents: phase === 'idle' ? 'none' : 'auto', '--curve-background': theme?.background || '#FDF9EE', backgroundColor: phase === 'covered' && theme ? theme.background : undefined }}
    >
      {width != null && (
        <motion.svg
          variants={reduced?{...translate,covering:{...translate.covering,transition:{duration:.01}},revealing:{...translate.revealing,transition:{duration:.01}}}:translate}
          initial="idle"
          animate={phase}
          onAnimationComplete={onAnimationComplete}
          viewBox={`0 0 ${width} ${height + 600}`}
          preserveAspectRatio="none"
        >
          <motion.path
            className="curve-transition-shape"
            variants={reduced?{idle:{d:targetPath},covering:{d:initialPath,transition:{duration:.01}},covered:{d:initialPath},revealing:{d:targetPath,transition:{duration:.01}}}:curve(initialPath, targetPath)}
            initial="idle"
            animate={phase}
          />
          {theme && <g>
            {[1,2,3].map(ring=><motion.circle key={ring} cx={width/2} cy={300+height/2} r={size*(.57+ring*.16)} fill="none" stroke={theme.squareColor} strokeWidth={ring===1?2:1} initial={false} animate={{scale:phase==='revealing'?1.18:1,opacity:phase==='idle'?0:.55,rotate:phase==='revealing'?12:0}} transition={{duration:reduced?0:.5,delay:reduced?0:ring*.035}} style={{transformOrigin:`${width/2}px ${300+height/2}px`}} strokeDasharray={ring===2?'4 9':undefined}/>)}
            <rect x={(width - size) / 2} y={300 + (height - size) / 2} width={size} height={size} rx={layout.radius} fill={theme.squareColor} />
            <image href={theme.icon} x={(width - iconSize) / 2} y={300 + (height - iconSize) / 2} width={iconSize} height={iconSize} preserveAspectRatio="xMidYMid meet" />
          </g>}
        </motion.svg>
      )}
    </div>,
    document.body,
  )
}