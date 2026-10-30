import * as THREE from 'three'
import { CONTINENT_MARKERS, MARKER_DEFAULTS } from './continentMarkerConfig.js'

// globe.glb's embedded equirectangular map: flipY=false, Greenwich u=.5,
// north v=0. Sampling the exported UV triangles preserves its axis convention,
// seam, mesh offset and negative ancestor scales without guessed rotations.
export function latLonToSurface(geometry, longitude, latitude) {
  const u = (longitude + 180) / 360, v = (90 - latitude) / 180
  const uv = geometry.attributes.uv, position = geometry.attributes.position
  const index = geometry.index
  const count = index ? index.count : position.count
  for (let i = 0; i < count; i += 3) {
    const ids = [0, 1, 2].map(j => index ? index.getX(i + j) : i + j)
    const [a, b, c] = ids.map(id => new THREE.Vector2().fromBufferAttribute(uv, id))
    const den = (b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y)
    if (Math.abs(den) < 1e-12) continue
    const wa = ((b.y-c.y)*(u-c.x)+(c.x-b.x)*(v-c.y))/den
    const wb = ((c.y-a.y)*(u-c.x)+(a.x-c.x)*(v-c.y))/den
    const wc = 1-wa-wb
    if (Math.min(wa,wb,wc) < -1e-6) continue
    return new THREE.Vector3().fromBufferAttribute(position,ids[0]).multiplyScalar(wa)
      .addScaledVector(new THREE.Vector3().fromBufferAttribute(position,ids[1]),wb)
      .addScaledVector(new THREE.Vector3().fromBufferAttribute(position,ids[2]),wc)
  }
  throw new Error(`No Earth UV triangle for ${longitude}, ${latitude}`)
}

export function modelBounds(object) {
  object.updateWorldMatrix(true, true)
  const bounds = new THREE.Box3()
  object.traverse(child => {
    if (!child.isMesh || child.userData.continentMarker) return
    child.geometry.computeBoundingBox()
    bounds.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld))
  })
  return bounds
}

export function createContinentMarkers(root) {
  const earth = root.getObjectByName('earth')
  let surfaceMesh
  earth?.traverse(object => {
    if (object.isMesh && object.geometry.attributes.uv && object.material?.map) surfaceMesh ??= object
  })
  if (!surfaceMesh) throw new Error('Earth surface mesh with UV and texture was not found')
  surfaceMesh.geometry.computeBoundingBox()
  const center = surfaceMesh.geometry.boundingBox.getCenter(new THREE.Vector3())
  const position = surfaceMesh.geometry.attributes.position
  const point = new THREE.Vector3()
  let radius = 0
  for (let i=0;i<position.count;i++) radius=Math.max(radius,point.fromBufferAttribute(position,i).distanceTo(center))
  // Validate before allocating marker resources; never silently move centers.
  for (const config of CONTINENT_MARKERS) {
    const surfaceOffset = MARKER_DEFAULTS.globalSurfaceOffset + config.surfaceOffset
    if (config.radius <= 0 || config.radius*Math.max(1,config.hover.scale) >= surfaceOffset) {
      throw new Error(`Continent ${config.id}: hover radius must be positive and smaller than total surface offset`)
    }
  }
  const group = new THREE.Group()
  group.name = 'continentMarkers'
  // Full relative matrix preserves imported rotations, translation AND reflection.
  // Mesh FrontSide rendering/raycasting handles the inherited negative determinant.
  group.matrixAutoUpdate = false
  earth.add(group)
  root.updateWorldMatrix(true,true)
  const syncMatrix = () => {
    surfaceMesh.updateWorldMatrix(true,false)
    earth.updateWorldMatrix(true,false)
    group.matrix.copy(earth.matrixWorld).invert().multiply(surfaceMesh.matrixWorld)
    group.matrixWorldNeedsUpdate = true
    group.updateWorldMatrix(false,true)
  }
  syncMatrix()
  // Shared annulus only: the transparent hole leaves the colored sphere intact.
  const ringCanvas = document.createElement('canvas')
  ringCanvas.width = ringCanvas.height = 256
  const ringContext = ringCanvas.getContext('2d')
  const outerPixels = 126
  const ringRatio = 1 + MARKER_DEFAULTS.outlineWidthRatio
  ringContext.fillStyle = '#FFFFFF'
  ringContext.beginPath()
  ringContext.arc(128,128,outerPixels,0,Math.PI*2)
  ringContext.arc(128,128,outerPixels/ringRatio,0,Math.PI*2,true)
  ringContext.fill('evenodd')
  const ringTexture = new THREE.CanvasTexture(ringCanvas)
  ringTexture.colorSpace = THREE.SRGBColorSpace
  const ringMaterial = new THREE.SpriteMaterial({ map: ringTexture, color: 0xffffff,
    depthTest: true, depthWrite: false, toneMapped: false, alphaTest: 0.01 })
  const materials = [], spheres = []
  const occluders = []
  root.traverse(object => { if (object.isMesh) occluders.push(object) })
  let hovered = null
  for (const config of CONTINENT_MARKERS) {
    const direction = latLonToSurface(surfaceMesh.geometry,config.longitude,config.latitude)
      .addScaledVector(new THREE.Vector3(...config.offset),radius).sub(center).normalize()
    const surfaceOffset = MARKER_DEFAULTS.globalSurfaceOffset + config.surfaceOffset
    const geometry = new THREE.SphereGeometry(radius*config.radius,32,24)
    const material = new THREE.MeshBasicMaterial({ color: config.color,
      side: THREE.FrontSide, depthTest: true, depthWrite: true, toneMapped: false })
    materials.push(material)
    const sphere = new THREE.Mesh(geometry,material)
    sphere.name = `continent-${config.id}`
    sphere.userData.continentMarker = config
    sphere.userData.hoverTween = { from: 1, to: 1, startedAt: 0 }
    sphere.position.copy(center).addScaledVector(direction,radius*(1+surfaceOffset))
    const ring = new THREE.Sprite(ringMaterial)
    ring.name = `continent-outline-${config.id}`
    ring.userData.continentMarker = config
    ring.raycast = () => {} // Decoration never intercepts hover/click or body picks.
    sphere.add(ring)
    group.add(sphere); spheres.push(sphere)
  }
  const visibleInHierarchy = object => {
    for (let current=object;current;current=current.parent) if (!current.visible) return false
    return true
  }
  const localCamera = new THREE.Vector3(), radial = new THREE.Vector3()
  const ringCenter = new THREE.Vector3(), sphereWorldScale = new THREE.Vector3()
  const inverseGroup = new THREE.Matrix4(), localRay = new THREE.Ray()
  const hitSphere = new THREE.Sphere(), localHit = new THREE.Vector3(), worldHit = new THREE.Vector3()
  const applyHoverScale = (sphere, now) => {
    const tween=sphere.userData.hoverTween, config=sphere.userData.continentMarker
    const progress=THREE.MathUtils.clamp((now-tween.startedAt)/Math.max(1,config.hover.durationMs),0,1)
    const eased=progress*progress*(3-2*progress)
    sphere.scale.setScalar(THREE.MathUtils.lerp(tween.from,tween.to,eased))
  }
  const anchorFacesCamera = (sphere, cameraPosition) => {
    localCamera.copy(cameraPosition); group.worldToLocal(localCamera); localCamera.sub(center)
    radial.copy(sphere.position).sub(center).normalize()
    // Hide markers whose underlying Earth-surface anchor is past the horizon;
    // this avoids isolated floating balls showing around the back-side limb.
    return radial.dot(localCamera) > radius
  }
  return {
    update(camera) {
      syncMatrix()
      const now=performance.now()
      for (const sphere of spheres) {
        applyHoverScale(sphere,now)
        sphere.visible=anchorFacesCamera(sphere,camera.position)
        const ring = sphere.children[0]
        sphere.getWorldPosition(ringCenter)
        sphere.getWorldScale(sphereWorldScale)
        const worldRadius = sphere.geometry.parameters.radius*Math.abs(sphereWorldScale.x)
        const distance = ringCenter.distanceTo(camera.position)
        ring.visible = distance > worldRadius
        // Correct the silhouette radius for perspective; inheritance supplies
        // the exact same hover scale as the sphere, without moving its center.
        const correction = distance > worldRadius ? distance/Math.sqrt(distance*distance-worldRadius*worldRadius) : 1
        ring.scale.setScalar(2*sphere.geometry.parameters.radius*ringRatio*(128/outerPixels)*correction)
      }
      group.updateWorldMatrix(false,true)
    },
    pick(raycaster) {
      // Analytic hit spheres add no renderable objects and use the same local
      // coordinates as the visible spheres, including imported reflections.
      inverseGroup.copy(group.matrixWorld).invert()
      localRay.copy(raycaster.ray).applyMatrix4(inverseGroup)
      const candidates=[]
      for (const sphere of spheres) {
        if (!visibleInHierarchy(sphere) || !anchorFacesCamera(sphere,raycaster.ray.origin)) continue
        const visibleRadius=sphere.geometry.parameters.radius*sphere.scale.x
        hitSphere.set(sphere.position,visibleRadius*MARKER_DEFAULTS.hitRadiusScale)
        if (!localRay.intersectSphere(hitSphere,localHit)) continue
        worldHit.copy(localHit).applyMatrix4(group.matrixWorld)
        const distance=worldHit.distanceTo(raycaster.ray.origin)
        if (distance<raycaster.near || distance>raycaster.far) continue
        hitSphere.radius=visibleRadius
        const actual=Boolean(localRay.intersectSphere(hitSphere,localHit))
        if (!actual) localRay.closestPointToPoint(sphere.position,localHit)
        const occlusionDistance=worldHit.copy(localHit).applyMatrix4(group.matrixWorld).distanceTo(raycaster.ray.origin)
        const blocker=raycaster.intersectObjects(occluders,false).find(other=>other.distance<occlusionDistance-1e-5 && visibleInHierarchy(other.object))
        if (blocker) continue
        const centerDistanceSq=localRay.distanceSqToPoint(sphere.position)
        candidates.push({ sphere, actual,
          score: centerDistanceSq/(visibleRadius*visibleRadius), distance })
      }
      // Visible bodies win over another marker's added hit margin. If margins
      // overlap, choose the nearest normalized center rather than array order.
      candidates.sort((a,b)=>Number(b.actual)-Number(a.actual)||a.score-b.score||a.distance-b.distance)
      return candidates[0]?.sphere ?? null
    },
    hover(sphere) {
      if (sphere===hovered) return
      const now=performance.now()
      for (const marker of [hovered,sphere]) {
        if (!marker) continue
        applyHoverScale(marker,now)
        const tween=marker.userData.hoverTween
        tween.from=marker.scale.x
        tween.to=marker===sphere ? marker.userData.continentMarker.hover.scale : 1
        tween.startedAt=now
      }
      hovered=sphere
    },
    dispose() {
      group.removeFromParent()
      spheres.forEach(sphere=>sphere.geometry.dispose())
      materials.forEach(material=>material.dispose())
      ringMaterial.dispose()
      ringTexture.dispose()
    },
  }
}
