// Vite emits hashed URLs in production, including the original Chinese filenames.
const files = import.meta.glob('../../../Art/telescope/yuta-live2d/*', { eager: true, query: '?url', import: 'default' })
const asset = name => {
  const url = files[`../../../Art/telescope/yuta-live2d/${name}`]
  if (!url) throw new Error(`Missing Yuta asset: ${name}`)
  return url
}
export const YUTA_ASSETS = {
  model: asset('Live2DYuta.model3.json'), moc: asset('Live2DYuta.moc3'),
  texture: asset('Texture-yuta.png'), displayInfo: asset('Live2DYuta.cdi3.json'),
}
export const YUTA_MOTIONS = Object.fromEntries([
  '待機1', '待機2', '待機3', '待機一般', '指右邊', '開場', '對話', '對話-思考', '對話-開心', '對話-wink',
].map(name => [name, asset(`${name}.motion3.json`)]))

// Preserve editorial labels separately from the actual exported filenames.
export function resolveYutaMotion(name) {
  const resolved = name === '對話-笑容' ? '對話-開心' : name
  if (resolved == null) return null
  if (!Object.hasOwn(YUTA_MOTIONS, resolved)) throw new Error(`Unknown Yuta motion: ${name}`)
  return resolved
}
