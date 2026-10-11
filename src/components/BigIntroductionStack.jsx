import { motion } from 'framer-motion'
import './BigIntroductionStack.css'

const stackVariants = {
  closed: {
    x: '112%',
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 230, damping: 27, mass: 0.85 },
      opacity: { duration: 0.16, ease: 'easeOut' },
    },
  },
  open: {
    x: '0%',
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 230, damping: 27, mass: 0.85 },
      opacity: { duration: 0.18, ease: 'easeOut' },
    },
  },
}

function BigIntroductionStack({ stack, isOpen }) {
  if (stack.length === 0) return null

  return (
    <div className="big-introduction-stack" aria-hidden={!isOpen}>
      <div className="big-introduction-stack__positioner">
        <motion.div
          className="big-introduction-stack__container"
          variants={stackVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
        >
          {stack.map((item, index) => (
            <img
              key={item.interactionId}
              className="big-introduction-stack__paper"
              src={item.imageSrc}
              alt={`${item.interactionId} introduction page`}
              draggable="false"
              style={{
                zIndex: index + 1,
                transform: `translate(${item.offsetX}px, ${item.offsetY}px) rotate(${item.rotation}deg)`,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default BigIntroductionStack
