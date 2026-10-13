import { ENDING_RULES as R } from './config.js'

export const ENDINGS = [
  { id: 'noah', number: 'I', title: '諾亞方舟', english: 'Two of everything. Please.', color: '#7FB9EC', symbol: 'ark', text: '雨下得太有誠意，整座島只剩屋頂的想像空間。魔法師開始點名：每種動物兩隻，雨水藥水請不要上船。', cause: '大量降雨使海面急速上升，低地被洪水淹沒。' },
  { id: 'apocalypse', number: 'II', title: '2012 世界末日', english: 'The calendar was innocent.', color: '#F691A6', symbol: 'split', text: '急熱、急冷、再急熱。山脈終於遞出辭呈。研究結論：這次真的不能怪瑪雅人的月曆。', cause: '反覆跨越極端高低溫，地形產生裂隙與崩塌。' },
  { id: 'ice', number: 'III', title: '冰河世紀', english: 'A rather long winter.', color: '#A2D8DE', symbol: 'snow', text: '海洋凍住了，山也蓋好了被子。魔法師寫下：「暫停研究，先找毛襪。」某隻松鼠仍在忙著找橡實。', cause: '持續低溫讓大部分海面結冰，陸地覆滿霜雪。' },
  { id: 'atlantis', number: 'IV', title: '失落的亞特蘭提斯', english: 'Excellent sea views. Everywhere.', color: '#E5DDF5', symbol: 'ruin', text: '海岸慢慢退讓，最後連地址也退到了海底。魔法師的房產廣告只剩一句：「全島海景，需自備潛水裝備。」', cause: '浸水與海岸侵蝕持續發生，陸地逐步沉入海洋。' },
  { id: 'sahara', number: 'V', title: '撒哈拉大沙漠', english: 'Too much of a good sun.', color: '#F6F0A9', symbol: 'dune', text: '陽光加班太久，草地集體改行當沙丘。魔法師把「日光浴」劃掉，改寫成「烤箱使用心得」。', cause: '持續酷熱與蒸發讓土地乾燥，大部分地表沙漠化。' },
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
