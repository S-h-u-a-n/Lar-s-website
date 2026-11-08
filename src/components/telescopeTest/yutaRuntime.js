import { chooseIdleMotion, chooseDialogueIdle } from './dialogue/motionPolicy'
import { YUTA_ASSETS, YUTA_MOTIONS, resolveYutaMotion } from './yutaAssets'
let corePromise, frameworkInitialized = false
function loadCore() {
  if (!corePromise) corePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${import.meta.env.BASE_URL}vendor/live2d/live2dcubismcore.min.js`
    script.onload = () => resolve()
    script.onerror = () => { corePromise = null; script.remove(); reject(new Error('Cubism Core failed to load')) }
    document.head.append(script)
  })
  return corePromise
}
async function bytes(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Yuta resource ${response.status}: ${url}`)
  return response.arrayBuffer()
}
export async function createYuta(canvas, signal, onMotion, { autoOpening = true } = {}) {
  await loadCore()
  // The Framework evaluates Core enums at module scope; import only after Core exists.
  const [{ CubismFramework }, { CubismUserModel }, { CubismMotionQueueManager }, { CubismShaderManager_WebGL }] = await Promise.all([
    import('../../vendor/cubism/src/live2dcubismframework'),
    import('../../vendor/cubism/src/model/cubismusermodel'),
    import('../../vendor/cubism/src/motion/cubismmotionqueuemanager'),
    import('../../vendor/cubism/src/rendering/cubismshader_webgl'),
  ])
  if (!frameworkInitialized) { CubismFramework.startUp(); CubismFramework.initialize(); frameworkInitialized = true }
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  const source = JSON.parse(new TextDecoder().decode(await bytes(YUTA_ASSETS.model, signal)))
  // Resolve exported references through Vite URLs without changing source model data.
  const config = { ...source, FileReferences: { ...source.FileReferences,
    Moc: YUTA_ASSETS.moc, Textures: [YUTA_ASSETS.texture], DisplayInfo: YUTA_ASSETS.displayInfo,
  } }
  const [moc, motionBuffers, textureBytes] = await Promise.all([
    bytes(config.FileReferences.Moc, signal),
    Promise.all(Object.entries(YUTA_MOTIONS).map(async ([name, url]) => [name, await bytes(url, signal)])),
    bytes(config.FileReferences.Textures[0], signal),
  ])
  const image = await createImageBitmap(new Blob([textureBytes], { type: 'image/png' }), { premultiplyAlpha: 'premultiply' })
  if (signal.aborted) { image.close(); throw new DOMException('Aborted', 'AbortError') }
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true })
  if (!gl) { image.close(); throw new Error('WebGL is unavailable') }
  const user = new CubismUserModel()
  const queue = new CubismMotionQueueManager()
  const textures = []
  const motions = new Map()
  let registered = false
  let frame = 0, disposed = false, current = '', pending = null, immediate = null, transition = null, time = 0, previous = 0, dialogueActive = false, lastInteraction = performance.now()
  function dispose() {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    queue.release()
    motions.forEach(motion => motion.release())
    user.release()
    textures.forEach(texture => gl.deleteTexture(texture))
    if (registered) CubismShaderManager_WebGL.getInstance().releaseGlContext(gl)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  try {
    const version = Live2DCubismCore.Version.csmGetMocVersion(moc)
    if (version > Live2DCubismCore.Version.csmGetLatestMocVersion()) throw new Error(`Unsupported moc3 version ${version}`)
    user.loadModel(moc, true)
    if (!user.getModel()) throw new Error('Cubism could not load Yuta moc3')
    user.createRenderer(canvas.width, canvas.height)
    const renderer = user.getRenderer()
    renderer.startUp(gl)
    registered = true
    renderer.loadShaders(`${import.meta.env.BASE_URL}vendor/live2d/Shaders/WebGL/`)
    const texture = gl.createTexture()
    textures.push(texture)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    renderer.bindTexture(0, texture)
    renderer.setIsPremultipliedAlpha(true)
    for (const [name, buffer] of motionBuffers) {
      const motion = user.loadMotion(buffer, buffer.byteLength, name)
      if (!motion) throw new Error(`Invalid motion: ${name}`)
      // Playback policy only; the exported JSON and curves remain untouched.
      motion.setLoop(false)
      motion.setEffectIds([], [])
      motions.set(name, motion)
    }
    // Complete asynchronous shader setup before exposing the ready instance.
    const shader = CubismShaderManager_WebGL.getInstance().getShader(gl)
    const deadline = performance.now() + 10000
    while (!shader._isShaderLoaded) {
      if (performance.now() > deadline) throw new Error('Cubism shaders did not load')
      await new Promise(resolve => setTimeout(resolve, 16))
    }
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    const matrix = user.getModelMatrix()
    matrix.setHeight(2.08)
    matrix.setPosition(0, 0)
    function start(name, interrupt = false) {
      if (current) {
        const model = user.getModel()
        transition = { at: time, values: Array.from({ length: model.getParameterCount() }, (_, index) => model.getParameterValueByIndex(index)) }
      }
      if (interrupt) queue.stopAllMotions()
      current = name
      queue.startMotion(motions.get(name), false, time)
      canvas.dataset.motion = name
      canvas.dataset.motionSerial = String(Number(canvas.dataset.motionSerial || 0) + 1)
      onMotion?.(name)
    }
    function next() {
      if (pending) { const name = pending; pending = null; return name }
      if (current.startsWith('對話') || current === '開場' || current === '指右邊') return chooseDialogueIdle()
      return chooseIdleMotion({ current, dialogueActive, idleForMs: performance.now() - lastInteraction })
    }
    const normalIdle = () => '待機3'
    canvas.dataset.loadedMotions = JSON.stringify([...motions.keys()])
    start(autoOpening ? '開場' : normalIdle())
    function draw(now) {
      if (disposed) return
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 0
      previous = now
      if (!document.hidden) time += dt
      // Only the latest segment command is consumed. No finish callback can
      // revive an older motion, and just one SDK motion owns parameters.
      if (immediate) {
        const command = immediate
        immediate = null
        pending = null
        start(command.name ?? normalIdle(), true)
      } else if (queue.isFinished()) start(next())
      user.getModel().loadParameters()
      queue.doUpdateMotion(user.getModel(), time)
      if (transition) {
        const progress = Math.min(1, (time - transition.at) / .18)
        const weight = progress * progress * (3 - 2 * progress)
        transition.values.forEach((from, index) => {
          const to = user.getModel().getParameterValueByIndex(index)
          user.getModel().setParameterValueByIndex(index, from + (to - from) * weight)
        })
        if (progress === 1) transition = null
      }
      user.getModel().update()
      const size = Math.round(Math.min(devicePixelRatio || 1, 2) * canvas.clientWidth)
      if (size && canvas.width !== size) canvas.width = canvas.height = size
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      renderer.setMvpMatrix(matrix)
      renderer.setRenderState(null, [0, 0, canvas.width, canvas.height])
      renderer.drawModel()
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return {
      play(name) {
        const resolved = resolveYutaMotion(name)
        if (!resolved) throw new Error('A motion name is required')
        pending = resolved
      },
      // A segment command is one-shot, including plain 對話. Null explicitly
      // cancels the prior dialogue motion and returns to normal idle.
      startDialogue(name) { immediate = { name: resolveYutaMotion(name) } },
      endDialogue() { immediate = { name: null } },
      setActivity({ active, resetIdle = false }) {
        dialogueActive = active
        if (resetIdle) lastInteraction = performance.now()
      },
      dispose,
    }
  } catch (error) { dispose(); throw error }
  finally { image.close() }
}
