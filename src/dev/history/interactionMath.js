export const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value))
export function spring(state, destination, dt, stiffness, damping, epsilon = .001) {
  const count = Math.max(1, Math.ceil(dt * 120)), step = dt / count
  for (let i = 0; i < count; i++) {
    state.velocity += (stiffness * (destination - state.value) - damping * state.velocity) * step
    state.value += state.velocity * step
  }
  if (Math.abs(state.value - destination) + Math.abs(state.velocity) < epsilon) {
    state.value = destination; state.velocity = 0; return false
  }
  return true
}
export function entranceProgress(elapsed, settings, reduced = false) {
  if (reduced) return { progress: 1, offset: 0, opacity: 1 }
  const t = clamp((elapsed - settings.delay) / settings.duration, 0, 1)
  const back = settings.overshoot || 0, q = t - 1
  const eased = t === 1 ? 1 : 1 + (back + 1) * q ** 3 + back * q ** 2
  return { progress: t, offset: 1 - eased, opacity: clamp(t * 5, 0, 1) }
}
// Inverse of translateY -> perspective -> rotateX -> rotateZ -> foot scale.
// Avoids per-pointer layout reads and accounts for rotation, not just its AABB.
export function localPoint(pose, x, y) {
  const ox = pose.width * pose.origin[0] / 100, oy = pose.height * pose.origin[1] / 100
  const qx = x - pose.x - ox, qy = y - pose.y - oy - pose.entryY
  const ax = pose.rotateX * Math.PI / 180, az = pose.rotateZ * Math.PI / 180
  const ry = qy / (Math.cos(ax) + qy * Math.sin(ax) / pose.perspective)
  const rx = qx * (1 - Math.sin(ax) * ry / pose.perspective)
  return [(Math.cos(az) * rx + Math.sin(az) * ry) / pose.scale + ox,
    (-Math.sin(az) * rx + Math.cos(az) * ry) / pose.scale + oy]
}
export function opaqueAt(geometry, bits, u, v, width, height) {
  if (u < 0 || v < 0 || u >= width || v >= height) return false
  const x = Math.floor(u / width * geometry.maskWidth), y = Math.floor(v / height * geometry.maskHeight)
  const index = y * geometry.maskWidth + x
  return (bits[index >> 3] & (128 >> (index & 7))) !== 0
}
