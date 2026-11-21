import placements from '../../../dev/history/placements.json'
import masks from '../../../dev/history/interactionGeometry.json'
import records from './records.json'
import referenceIds from './wikipediaReferenceIds.json'
import references from './sources.json'
import { collectReferences } from './references'
import { parseHistoryArticle } from './parseArticle'

const sources = import.meta.glob('/Art/IntroScreen/history/people-*.PNG', { eager: true, query: '?url', import: 'default' })
const articleFiles = Object.entries(import.meta.glob('/content/history/*.md', { eager: true, query: '?raw', import: 'default' }))
  .map(([path, text]) => {
    const match = path.match(/\/(\d{2})-[^/]+\.md$/)
    if (!match) throw new Error(`Unexpected history article filename: ${path}`)
    return { order: Number(match[1]), path, text }
  })
  .sort((a, b) => a.order - b.order)

if (articleFiles.length !== records.length) {
  throw new Error(`Expected ${records.length} history articles, found ${articleFiles.length}`)
}

export const HISTORY_RECORDS = records.map((record, index) => {
  const articleFile = articleFiles[index]
  if (articleFile.order !== index + 1) {
    throw new Error(`Expected history article ${String(index + 1).padStart(2, '0')}, found ${articleFile.path}`)
  }
  const article = parseHistoryArticle(articleFile.text, articleFile.path)
  return {
    ...record, ...article, index,
    wikipediaReferences: collectReferences({ sources: referenceIds[record.id] }, references),
    sourceNote: '本清單彙整各分類實際參考的維基百科條目，相同條目僅列一次。年代採概略分期，涉及推測、爭議及本卷觀察範圍之處另於正文說明。',
    verifiedAt: '2026-11-11',
    placement: placements.find(item => item.id === record.id), interaction: masks[record.id],
    src: sources[`/Art/IntroScreen/history/${record.id}.PNG`],
    // These are period illustrations, not identified historical individuals.
    illustrationNote: record.illustrationNote || '插畫為時代意象，不代表特定歷史人物。排列非等比例年代尺。',
  }
})
