import { ENDING_RULES as R } from './config.js'

export const ENDINGS = [
  { id: 'noah', number: 'I', title: '諾亞方舟', english: 'Noah’s Ark', color: '#7FB9EC', symbol: 'ark', text: '雨下太多太久了啊⋯！！諾亞都開始當寶可夢大師開始收集動物了！', cause: '大量降雨使海面急速上升，低地被洪水淹沒。' },
  { id: 'apocalypse', number: 'II', title: '2012 世界末日', english: '2012 Doomsday', color: '#F691A6', symbol: 'split', text: '啊⋯⋯瑪雅人當時果然沒說錯⋯⋯', cause: '反覆跨越極端高低溫，地形產生裂隙與崩塌。' },
  { id: 'ice', number: 'III', title: '冰河世紀', english: 'Ice Age', color: '#A2D8DE', symbol: 'snow', text: '那隻松鼠怎麼又在追橡實啊？！', cause: '持續低溫讓大部分海面結冰，陸地覆滿霜雪。' },
  { id: 'atlantis', number: 'IV', title: '失落的亞特蘭提斯', english: 'The Lost Atlantis', color: '#E5DDF5', symbol: 'ruin', text: '啊哈哈⋯這下會被未來的地球人當成古蹟吧（？）也挺好？', cause: '浸水與海岸侵蝕持續發生，陸地逐步沉入海洋。' },
  { id: 'sahara', number: 'V', title: '撒哈拉大沙漠', english: 'Sahara Desert', color: '#F6F0A9', symbol: 'dune', text: '這下要重新編寫這裡的地理情況啦⋯⋯嘿嘿', cause: '持續酷熱與蒸發讓土地乾燥，大部分地表沙漠化。' },
]
export function evaluateEnding(model, dt) {
  const m = model.metrics, temp = model.temperature
  const conditions = {
    apocalypse: m.damage >= R.apocalypse.damage,
    noah: model.rainAdded >= 12000 && m.damage < .5 && model.seaLevel >= R.noah.seaLevel && m.lostLand >= R.noah.lostLand && model.riseRate >= R.noah.riseRate,
    ice: temp <= R.ice.temperature && m.ice >= R.ice.ice && m.snow >= R.ice.snow,
    sahara: temp >= R.sahara.temperature && m.desert >= R.sahara.desert && m.moisture < R.sahara.moisture,
    atlantis: m.damage < .5 && m.erosion >= R.atlantis.erosion && m.lostLand >= R.atlantis.lostLand && model.riseRate < R.atlantis.riseRate,
  }
  for (const id of ['apocalypse', 'noah', 'ice', 'sahara', 'atlantis']) {
    model.endingTimers[id] = model.time >= R.graceSeconds && conditions[id] ? (model.endingTimers[id] || 0) + dt : 0
    if (model.endingTimers[id] >= R[id].seconds) {
      model.ending = id
      model.input = null
      return id
    }
  }
  return null
}
