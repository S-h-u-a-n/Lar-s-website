// A new paragraph is not itself an animation command. Only explicit motions
// are dispatched, even when successive paragraphs specify the same motion.
export function createSegmentMotionDispatcher() {
  let previousRuntime, handledKey
  return (runtime, key, motion) => {
    if (!runtime) return false
    if (runtime !== previousRuntime) { previousRuntime = runtime; handledKey = Symbol('unhandled') }
    if (handledKey === key) return false
    handledKey = key
    if (motion == null) return false
    runtime.startDialogue(motion)
    return true
  }
}
