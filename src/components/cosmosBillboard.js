import * as THREE from 'three'

export function createCosmosBillboard(root) {
  for (const name of ['cosmos_plane_02', 'cosmos_plane_03', 'cosmos_plane_04', 'cosmos_plane_05', 'cosmos_core']) {
    const object = root.getObjectByName(name)
    if (object) object.visible = false
  }
  const plane = root.getObjectByName('cosmos_plane_01')
  if (!plane) return null
  plane.visible = true

  const parentLinear = new THREE.Matrix3()
  const inverseParent = new THREE.Matrix3()
  const normalToLocal = new THREE.Matrix3()
  const normal = new THREE.Vector3()
  const up = new THREE.Vector3()
  const right = new THREE.Vector3()
  const back = new THREE.Vector3()
  const basis = new THREE.Matrix4()
  return camera => {
    camera.updateWorldMatrix(true, false)
    plane.parent.updateWorldMatrix(true, false)
    parentLinear.setFromMatrix4(plane.parent.matrixWorld)
    inverseParent.copy(parentLinear).invert()
    normalToLocal.copy(parentLinear).transpose()
    // The exported carrier lies in XZ with a +Y normal, not the usual XY plane.
    // Transform normals with A^T and tangents with A^-1: the GLB parent has
    // negative, nonuniform scale, so simply copying camera.quaternion is wrong.
    normal.setFromMatrixColumn(camera.matrixWorld, 2).applyMatrix3(normalToLocal).normalize()
    up.setFromMatrixColumn(camera.matrixWorld, 1).applyMatrix3(inverseParent)
    up.addScaledVector(normal, -up.dot(normal)).normalize()
    right.crossVectors(up, normal).normalize()
    back.copy(up).negate()
    basis.makeBasis(right, normal, back)
    plane.quaternion.setFromRotationMatrix(basis)
  }
}

