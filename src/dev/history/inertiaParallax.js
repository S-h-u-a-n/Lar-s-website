// Background-only state. Drive it from actual presented camera travel, not wheel
// events or pointer input. Offsets are normalized, bounded and never accumulated.
export function stepParallax(state, travel, dt, config, reduced = false) {
  if (reduced) { state.position = state.velocity = state.scrollVelocity = 0; return false }
  const seconds = Math.max(.001, Math.min(dt, .032))
  const measuredVelocity = travel / seconds
  state.scrollVelocity += (measuredVelocity - state.scrollVelocity) * (1 - Math.exp(-seconds / config.velocitySmoothing))
  const destination = -Math.tanh(state.scrollVelocity / config.velocityScale)
  const steps = Math.ceil(seconds / (1 / 120)), step = seconds / steps
  for (let i = 0; i < steps; i++) {
    state.velocity += (config.stiffness * (destination - state.position) - config.damping * state.velocity) * step
    state.position += state.velocity * step
    if (Math.abs(state.position) > 1) {
      state.position = Math.sign(state.position)
      if (state.position * state.velocity > 0) state.velocity = 0
    }
  }
  const active = Math.abs(state.position) + Math.abs(state.velocity) + Math.abs(state.scrollVelocity) / config.velocityScale > config.settle
  if (!active) state.position = state.velocity = state.scrollVelocity = 0
  return active
}
