import assert from 'node:assert/strict'
import { createSegmentMotionDispatcher } from '../src/components/telescopeTest/dialogue/motionDispatch.js'
const commands = [], runtime = { startDialogue: motion => commands.push(motion) }
const dispatch = createSegmentMotionDispatcher()
assert(dispatch(runtime, 1, '對話-思考'))
assert(!dispatch(runtime, 2, null))
assert(!dispatch(runtime, 3, undefined))
assert.deepEqual(commands, ['對話-思考'])
assert(!dispatch(runtime, 3, undefined))
assert(dispatch(runtime, 4, '對話-開心'))
assert(dispatch(runtime, 5, '對話-開心'))
assert(!dispatch(runtime, 5, '對話-開心'))
assert(!dispatch(runtime, 6, null)) // Finishing a group is also not an animation reset.
assert.deepEqual(commands, ['對話-思考', '對話-開心', '對話-開心'])
const replacement = { startDialogue: motion => commands.push(motion) }
assert(dispatch(replacement, 5, '對話-開心'))
assert(!createSegmentMotionDispatcher()(replacement, 1, null))
console.log('Yuta motion dispatch passed: unmarked text sends zero commands, same-motion new segments retrigger once, duplicate renders do not retrigger, fresh runtime initializes safely.')
