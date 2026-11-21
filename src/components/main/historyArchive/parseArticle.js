const REFERENCE_HEADER = /^(?:參考資料|資料參考|參考網址)(?:[：:]|（|$)/
const SPECIAL_RECORD = /^特別紀錄[：:]/

function isSectionHeading(block) {
  const text = block.trim()
  if (SPECIAL_RECORD.test(text)) return true
  const singleLine = text.replace(/\s*\n\s*/g, ' ')
  return singleLine.length <= 30 && !/[。！？.!?；;]$/.test(singleLine)
}

export function parseHistoryArticle(raw, sourceName = 'history article') {
  const blocks = raw.trim().split(/\r?\n[ \t]*\r?\n/).map(block => block.trim()).filter(Boolean)
  const sourceTitle = blocks[0]?.match(/^\d+\.\s*(.+)$/)?.[1]?.trim()
  const title = blocks[1]?.trim()

  if (!sourceTitle || sourceTitle !== title) {
    throw new Error(`${sourceName}: expected a numbered source title followed by the matching article title`)
  }
  if (blocks.length < 7) {
    throw new Error(`${sourceName}: expected region, date, introduction, and article sections`)
  }

  const referenceIndex = blocks.findIndex((block, index) =>
    index >= 5 && REFERENCE_HEADER.test(block.split('\n', 1)[0].trim()),
  )
  if (referenceIndex < 0) {
    throw new Error(`${sourceName}: could not find a references section`)
  }

  const bodyBlocks = blocks.slice(4, referenceIndex)
  const firstSectionIndex = bodyBlocks.findIndex(isSectionHeading)
  if (firstSectionIndex < 1) {
    throw new Error(`${sourceName}: expected one or more introductory paragraphs before the first section`)
  }

  const sections = []
  for (const block of bodyBlocks.slice(firstSectionIndex)) {
    if (isSectionHeading(block)) {
      sections.push({
        title: block.trim(),
        paragraphs: [],
        special: SPECIAL_RECORD.test(block.trim()),
      })
    } else if (sections.length) {
      sections[sections.length - 1].paragraphs.push(block.trim())
    }
  }

  if (!sections.length || sections.some(section => !section.paragraphs.length)) {
    throw new Error(`${sourceName}: every section must have a heading and at least one paragraph`)
  }

  return {
    name: title,
    region: blocks[2],
    date: blocks[3],
    introduction: bodyBlocks.slice(0, firstSectionIndex),
    sections,
    references: blocks.slice(referenceIndex),
  }
}
