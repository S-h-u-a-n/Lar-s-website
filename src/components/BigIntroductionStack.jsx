import { motion } from 'framer-motion'
import { useEditableText } from '../dev/useEditableText'
import { useTextEditorState } from '../dev/textEditorStore'
import { BIG_INTRODUCTION_COPY } from './bigIntroductionPages'
import { PIGMENTS } from '../edition/palette'
import './BigIntroductionStack.css'

const NOTE_COPY_POSITION_ID = 'big-test-note-copy-position'
const DEFAULT_NOTE_COPY_POSITION = { x: 74.3, y: 29.7, fontScale: 150 }
const DEFAULT_ENTER_POSITIONS = {
  globe: { x: 74.44, y: 82.42 },
  telescope: { x: 74.33, y: 80.57 },
  'book-open1': { x: 74.66, y: 80.76 },
  'book-close1': { x: 74.86, y: 81.33 },
  ball: { x: 74.53, y: 82.26 },
  potion: { x: 74.56, y: 81.65 },
}
const ENTER_BUTTON_COLORS = {
  globe: PIGMENTS.strawberry,
  telescope: PIGMENTS.peach,
  'book-open1': PIGMENTS.butter,
  'book-close1': PIGMENTS.sky,
  ball: PIGMENTS.mint,
  potion: PIGMENTS.lavender,
}
const ENTER_LABELS = {
  globe: '地球',
  telescope: '望遠鏡',
  'book-open1': '自然研究筆記',
  'book-close1': '人文研究筆記',
  ball: '水晶球',
  potion: '魔法藥水',
}

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

function NoteCopyContent({ copy, position, editorProps = {} }) {
  return <article
    {...editorProps}
    className="big-introduction-stack__copy"
    style={{
      ...editorProps.style,
      left: `${position.x}%`,
      top: `${position.y}%`,
    }}
    aria-label={copy.title}
  >
    <h2>{copy.title}</h2>
    {copy.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
  </article>
}

function EditableNoteCopy({ copy, position }) {
  const text = useEditableText({
    id: NOTE_COPY_POSITION_ID,
    label: 'Big 物件筆記 · 共用文字群組排版',
    coordinateSpace: 'container-percent-center',
    defaultValues: DEFAULT_NOTE_COPY_POSITION,
  })
  return <NoteCopyContent copy={copy} position={position} editorProps={{ ref: text.ref, ...text.props }} />
}

function NoteCopy({ copy, position }) {
  return <NoteCopyContent copy={copy} position={position} />
}

function EnterActions({ item, actions, onEnter, onReplayStory }) {
  const position = useEditableText({
    id: `big-test-enter-position-${item.interactionId}`,
    label: `Big 物件筆記 · ${ENTER_LABELS[item.interactionId]} ENTER 位置`,
    coordinateSpace: 'container-percent-center-independent',
    defaultValues: DEFAULT_ENTER_POSITIONS[item.interactionId],
  })

  return (
    <div
      ref={position.ref}
      {...position.props}
      className="big-introduction-stack__actions"
    >
      <button
        type="button"
        className="big-introduction-stack__enter"
        data-enter-for={item.interactionId}
        style={{
          '--enter-hover-color': ENTER_BUTTON_COLORS[item.interactionId],
        }}
        onClick={() => onEnter?.(item.interactionId)}
      ><span>ENTER</span></button>
      {actions.replayableStory && (
        <button type="button" className="big-introduction-stack__replay" onClick={() => onReplayStory?.(item.interactionId)}>重播故事</button>
      )}
    </div>
  )
}

function BigIntroductionStack({ stack, isOpen, actions, onEnter, onReplayStory }) {
  const { data } = useTextEditorState()
  if (stack.length === 0) return null
  const sharedPosition = data[NOTE_COPY_POSITION_ID]?.values ?? DEFAULT_NOTE_COPY_POSITION

  return (
    <div className="big-introduction-stack" aria-hidden={!isOpen}>
      <div className="big-introduction-stack__positioner">
        <motion.div
          className="big-introduction-stack__container"
          variants={stackVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
        >
          {stack.map((item, index) => {
            const copy = BIG_INTRODUCTION_COPY[item.interactionId]
            return <div
              key={item.interactionId}
              className="big-introduction-stack__page"
              style={{
                zIndex: index + 1,
                transform: `translate(${item.offsetX}px, ${item.offsetY}px) rotate(${item.rotation}deg)`,
              }}
            >
              <img
                className="big-introduction-stack__paper"
                src={item.imageSrc}
                alt=""
                draggable="false"
              />
              {copy && <>
                {isOpen && index === stack.length - 1
                  ? <EditableNoteCopy copy={copy} position={sharedPosition} />
                  : <NoteCopy copy={copy} position={sharedPosition} />}
                {isOpen && index === stack.length - 1 && actions?.interactionId === item.interactionId && (
                  <EnterActions item={item} actions={actions} onEnter={onEnter} onReplayStory={onReplayStory} />
                )}
              </>}
            </div>
          })}
        </motion.div>
      </div>
    </div>
  )
}

export default BigIntroductionStack
