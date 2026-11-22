import { Matrix4 } from 'three'

// Measure only submitted vertices, after visibility and billboards are prepared.
// This is a lens framing value (camera-space x/depth), never an orbit pivot.
export function measureHorizontalFraming(root, camera) {
  root.updateWorldMatrix(true, true)
  camera.updateMatrixWorld(true)
  const transform = new Matrix4()
  let min = Infinity, max = -Infinity
  root.traverseVisible(object => {
    if (!object.isMesh) return
    const geometry = object.geometry
    const positions = geometry.attributes.position
    if (!positions) return
    const indices = geometry.index
    const count = indices ? indices.count : positions.count
    const start = Math.max(0, geometry.drawRange.start)
    const end = Math.min(count, start + geometry.drawRange.count)
    transform.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld)
    const m = transform.elements
    for (let i = start; i < end; i++) {
      const index = indices ? indices.getX(i) : i
      const x = positions.getX(index), y = positions.getY(index), z = positions.getZ(index)
      const depth = -(m[2]*x + m[6]*y + m[10]*z + m[14])
      if (depth <= 0) continue
      const horizontal = (m[0]*x + m[4]*y + m[8]*z + m[12]) / depth
      if (!Number.isFinite(horizontal)) continue
      min = Math.min(min, horizontal)
      max = Math.max(max, horizontal)
    }
  })
  return Number.isFinite(min) ? (min + max) / 2 : 0
}

export function applyHorizontalFraming(camera, width, height, framing) {
  // Start from the symmetric projection so resize never accumulates offsets.
  camera.clearViewOffset()
  camera.updateProjectionMatrix()
  const offset = framing * camera.projectionMatrix.elements[0] * width / 2
  camera.setViewOffset(width, height, offset, 0, width, height)
}
