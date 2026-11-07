import { article } from '../research/articleData'

// Keep source articles intact for an auditable content migration. The public
// list below contains only the resulting cards, with provenance on each item.
export const TOPIC_MERGES = [
  { ids: ['evolution', 'adaptation'], title: 'EVOLUTION & ADAPTATION', chineseName: '生物演化與適應', description: '族群如何跨世代改變，以及特徵與環境的關係。' },
  { ids: ['ecosystems', 'food-webs'], title: 'ECOSYSTEMS & FOOD WEBS', chineseName: '生態系統與食物網', description: '從環境、能量與物質，到生物之間的攝食連結。' },
  { ids: ['biodiversity', 'conservation'], title: 'BIODIVERSITY & CONSERVATION', chineseName: '生物多樣性與保育', description: '認識生命多樣性的層次，並用證據評估保育。' },
  { ids: ['stellar-evolution', 'black-holes'], title: 'STELLAR EVOLUTION & BLACK HOLES', chineseName: '恆星演化與黑洞', description: '從恆星形成到殘骸，以觀測檢驗演化與重力。' },
]

export function balanceNaturalArticles(sourceArticles) {
  const byId = Object.fromEntries(sourceArticles.map(item => [item.id, item]))
  const reviewed = item => ({ ...item, sources: item.sources.map(source => new URL(source.url).hostname === 'en.wikipedia.org' ? { ...source, accessedAt: '2026-11-07' } : source) })
  const rocks = byId['rocks-minerals'], waters = byId['rivers-lakes'], climate = byId.seasons
  const rockExamples = rocks.sections[1].text.split('硬度、')[0]
  const mineralClues = `硬度、${rocks.sections[1].text.split('硬度、')[1]}`
  const splits = {
    'rocks-minerals': [
      article('rocks-minerals', 'ROCKS & THE ROCK CYCLE', '岩石與岩石循環', '從礦物集合與岩石類型，讀出形成過程。',
        '岩石是礦物或其他地質材料的集合。成分、顆粒與構造記錄岩石形成及後來經歷的變化；辨識岩石不能只看顏色。', ['Rock (geology)'], [
          ['三大岩石類型', rocks.sections[0].text],
          ['從樣本讀過程', rockExamples],
        ]),
      article('minerals', 'MINERALS & IDENTIFICATION', '礦物與辨識', '化學組成、晶體結構與物理性質提供辨識線索。',
        '礦物通常具有特定化學組成與晶體結構，是許多岩石的組成材料。岩石的分類關注整體形成過程，礦物辨識則比較組成與性質。', ['Mineral'], [
          ['結構與性質', '礦物的原子排列具有規律，外形卻不一定呈現完整晶面。相同化學組成也可能因結構不同而有不同性質，例如鑽石與石墨都由碳組成；因此只知道成分仍不足以判定所有性質。'],
          ['多種線索交叉比較', mineralClues],
        ]),
    ],
    'rivers-lakes': [
      article('rivers-lakes', 'RIVERS & DRAINAGE BASINS', '河流與流域', '沿河道追蹤流水、侵蝕與沉積物的去向。',
        '河流沿河道搬運水與沉積物，並與流域、地下水及氣候相連。它們為生物與人類提供棲地和資源，也持續改變地形。', ['River'], [
          ['侵蝕、搬運與沉積', waters.sections[0].text],
          ['河流不是孤立的水道', '支流匯入幹流，形成相連的河網；流域邊界決定哪些區域的水會流向共同出口。河流可流入海洋、湖泊或其他河流，也可能在乾燥地區失去水量，並非每條河都能到達海洋。'],
        ]),
      article('lakes', 'LAKES & INLAND WATERS', '湖泊與內陸水域', '湖盆、出入水與混合方式，共同塑造水體環境。',
        '湖泊是在陸地凹地中聚集的水體，與流域、地下水及氣候相連。湖水的停留、流出與蒸發，會影響水位、鹽分和生物棲地。', ['Lake'], [
          ['湖泊不一定是淡水', waters.sections[1].text],
          ['水體分層與混合', '不同溫度的湖水可具有不同密度，形成較穩定的分層；風與季節冷卻則可能促進混合，改變氧氣及養分的分布。湖深與氣候不同，混合頻率也不同，不能把同一種季節循環套用到所有湖泊。'],
        ]),
    ],
    seasons: [
      article('seasons', 'CLIMATE & LONG-TERM PATTERNS', '氣候與長期變化', '比較長期統計、環境因素與氣候變化的證據。',
        '天氣描述短期大氣狀態，氣候則描述較長期的平均與變化範圍。研究氣候需要長期紀錄，而不是把某一天的天氣當成全部趨勢。', ['Climate'], [
          ['如何研究氣候？', climate.sections[1].text],
          ['分類與比較', '氣候分類可比較溫度、降水及其季節分布，例如辨認乾燥或濕潤的環境。分類是整理長期特徵的工具，區域內仍可能存在差異；相似緯度的地方，也可能因海洋與地形而有不同氣候。'],
        ]),
      article('seasonal-cycle', 'SEASONS & SUNLIGHT', '季節與日照', '自轉軸傾斜、日照與區域環境共同形成季節節律。',
        '季節是年內重複的日照與環境節律，各地不一定都以四季劃分。它是氣候的年內變化之一，與跨多年比較的氣候變化不同。', ['Season'], [
          ['季節不是因為忽遠忽近', climate.sections[0].text],
          ['季節與地方環境', '相同季節在不同地區不一定有相同溫度與降雨。海水與陸地升溫、降溫速度不同，可使氣溫變化落後於日照變化；因此最熱或最冷的時段，不一定正好落在夏至或冬至。'],
        ]),
    ],
  }
  // The NASA seasons reference belongs to the day-length/axial-tilt article.
  splits.seasons[1].sources.push(...climate.sources.filter(source => new URL(source.url).hostname !== 'en.wikipedia.org'))

  const secondaryIds = new Set(TOPIC_MERGES.flatMap(merge => merge.ids.slice(1)))
  return sourceArticles.flatMap(item => {
    if (secondaryIds.has(item.id)) return []
    if (splits[item.id]) return splits[item.id].map(part => ({ ...reviewed(part), topicIds: [item.id] }))
    const merge = TOPIC_MERGES.find(merge => merge.ids[0] === item.id)
    if (!merge) return [{ ...item, topicIds: [item.id] }]
    const originals = merge.ids.map(id => byId[id])
    const paragraphs = originals.flatMap(original => original.paragraphs)
    return [{
      ...item, title: merge.title, chineseName: merge.chineseName, description: merge.description,
      introduction: paragraphs.join('\n\n'), paragraphs,
      sections: originals.flatMap(original => original.sections),
      sources: [...new Map(originals.flatMap(original => original.sources).map(source => [source.url, source])).values()],
      topicIds: merge.ids,
    }]
  })
}
