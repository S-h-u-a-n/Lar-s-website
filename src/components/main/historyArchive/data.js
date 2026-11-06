import placements from '../../../dev/history/placements.json'
import masks from '../../../dev/history/interactionGeometry.json'
import { HISTORY_LABELS } from '../../../dev/history/labels'
import records from './records.json'

const sources = import.meta.glob('/Art/IntroScreen/history/people-*.PNG', { eager: true, query: '?url', import: 'default' })
export { default as HISTORY_SOURCES } from './sources.json'
export const HISTORY_RECORDS = records.map((record, index) => ({
  ...record, index, name: record.name || HISTORY_LABELS[record.id][0],
  placement: placements.find(item => item.id === record.id), interaction: masks[record.id],
  src: sources[`/Art/IntroScreen/history/${record.id}.PNG`],
  // These are period illustrations, not identified historical individuals.
  illustrationNote: record.illustrationNote || '插畫為時代意象，不代表特定歷史人物；排列非等比例年代尺。',
}))
