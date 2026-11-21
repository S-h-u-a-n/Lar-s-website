export function artworkLayout(width,height) {
  const ratio=width/height
  if(ratio<=1.2)return 'square'
  if(ratio<=1.8)return 'landscape'
  if(ratio<=3.5)return 'wide'
  return 'panoramic'
}
