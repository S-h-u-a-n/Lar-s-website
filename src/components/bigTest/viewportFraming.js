// Keep the original 38-degree artboard framing, but render the surrounding
// viewport too. A taller window gains vertical field of view instead of cropping.
export function getViewportFraming(width, height, artboardAspect = 7 / 4, baseFov = 38) {
  const artboardHeight = Math.min(height, width / artboardAspect)
  return {
    aspect: width / height,
    fov: 2 * Math.atan(Math.tan(baseFov * Math.PI / 360) * height / artboardHeight) * 180 / Math.PI,
  }
}
