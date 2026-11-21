// Opt-in, invisible diagnostics: ?profile=1. No instrumentation in normal preview.
export function createDiagnostics(host) {
  if (new URLSearchParams(location.search).get('profile') !== '1') return { frame() {}, dispose() {} }
  const report = { frames: 0, frameGaps: [], renderMs: [], longTasks: [], errors: [], resources: [], memory: null, longFrames: [] }
  let last = 0
  const observer = typeof PerformanceObserver === 'function' ? new PerformanceObserver(list => {
    report.longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))
  }) : null
  try { observer?.observe({ type: 'longtask', buffered: true }) } catch { /* Not supported by every browser. */ }
  const frameObserver = typeof PerformanceObserver === 'function' ? new PerformanceObserver(list => {
    report.longFrames.push(...list.getEntries().map(e => ({ start:e.startTime, duration:e.duration, blocking:e.blockingDuration, renderStart:e.renderStart, styleStart:e.styleAndLayoutStart,
      scripts:e.scripts?.map(s => ({duration:s.duration,url:s.sourceURL,invoker:s.invoker,forcedLayout:s.forcedStyleAndLayoutDuration})) })))
  }) : null
  try { frameObserver?.observe({type:'long-animation-frame',buffered:true}) } catch { /* Browser support varies. */ }
  const onError = e => report.errors.push(e.message || e.target?.src || 'Resource error')
  window.addEventListener('error', onError, true)
  const timer = setInterval(() => {
    report.resources = performance.getEntriesByType('resource').filter(e => e.initiatorType === 'img' && /\/history\/.*\.PNG/.test(e.name)).map(e => ({ id: e.name.split('/').pop(), status: e.responseStatus, bytes: e.encodedBodySize, duration: e.duration }))
    report.memory = performance.memory ? { usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize, note: 'JS heap only; excludes decoded images and GPU allocations' } : null
    host.dataset.diagnostics = JSON.stringify(report)
  }, 1000)
  return {
    frame(time, cost, continuing) {
      if (last && continuing) report.frameGaps.push(time - last)
      last = time; report.frames++; report.renderMs.push(cost)
      if (report.frameGaps.length > 600) report.frameGaps.shift()
      if (report.renderMs.length > 600) report.renderMs.shift()
    },
    dispose() { clearInterval(timer); observer?.disconnect(); frameObserver?.disconnect(); window.removeEventListener('error', onError, true) },
  }
}
