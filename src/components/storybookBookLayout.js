// Source registration: identical first-frame alpha silhouettes.
// openbook opaque bounds: (83,107)-(3751,1057), canvas 3815×1122.
// APNG first-frame bounds: (73,755)-(3741,1705), canvas 3798×1795.
// Therefore source-open = source-animation + (10,-648).
export const BOOK_REGISTRATION = {
  openWidth: 3815, openHeight: 1122, animationWidth: 3798, animationHeight: 1795,
  x: 10, y: -648,
}
export function alignBookAnimation(animation, openbook, stage) {
  if (!openbook) return animation
  const r = BOOK_REGISTRATION
  const sourceScale = openbook.width / 100 * stage.width / r.openWidth
  return { ...animation,
    x: openbook.x + r.x * sourceScale / stage.width * 100,
    y: openbook.y + r.y * sourceScale / stage.height * 100,
    width: openbook.width * r.animationWidth / r.openWidth,
    height: undefined,
    ratio: r.animationWidth / r.animationHeight,
    rotation: openbook.rotation,
  }
}
// Rotate around the same physical point as openbook's center, despite APNG padding.
export const BOOK_ANIMATION_ORIGIN = `${(BOOK_REGISTRATION.openWidth/2-BOOK_REGISTRATION.x)/BOOK_REGISTRATION.animationWidth*100}% ${(BOOK_REGISTRATION.openHeight/2-BOOK_REGISTRATION.y)/BOOK_REGISTRATION.animationHeight*100}%`
