function splitBlocks(markdown, sourceName) {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/^(#{1,3}\s+[^\r\n]+)$/gm, '\n\n$1\n\n')
  const blocks = normalized.trim().split(/\r?\n[ \t]*\r?\n/).map(block => block.trim()).filter(Boolean)
  if (!blocks[0]?.startsWith('# ') || blocks[0].startsWith('## ')) {
    throw new Error(`${sourceName}: expected one top-level Markdown title`)
  }
  return { title: blocks[0].slice(2).trim(), blocks: blocks.slice(1) }
}

function parseReferences(blocks, sourceName) {
  const sources = []
  let current = null

  const finish = () => {
    if (!current) return
    if (!current.title || !current.url) {
      throw new Error(`${sourceName}: each reference needs a name and URL`)
    }
    sources.push(current)
    current = null
  }

  for (const block of blocks) {
    for (const rawLine of block.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line) continue

      const metadata = line.match(/^(?:[-*+]\s+)?(Author|URL|Accessed|作者|網址|查閱日期):\s*(.*)$/i)
      const item = line.match(/^[-*+]\s+(.+)$/)
      const url = line.match(/^https?:\/\/\S+$/i)

      if (metadata) {
        if (!current) throw new Error(`${sourceName}: reference metadata must follow a reference name`)
        const key = ({ author:'author', url:'url', accessed:'accessedAt', 作者:'author', 網址:'url', 查閱日期:'accessedAt' })[metadata[1].toLowerCase()] ?? ({ 作者:'author', 網址:'url', 查閱日期:'accessedAt' })[metadata[1]]
        current[key] = metadata[2].trim()
      } else if (item) {
        finish()
        current = { title:item[1].replace(/^\*\*(.*)\*\*$/, '$1').trim() }
      } else if (url) {
        if (!current) throw new Error(`${sourceName}: reference URL must follow a reference name`)
        current.url = line
      } else {
        throw new Error(`${sourceName}: unrecognized reference entry: ${line}`)
      }
    }
  }

  finish()
  return sources
}

export function parseArticleMarkdown(markdown, sourceName = 'article Markdown') {
  const { title, blocks } = splitBlocks(markdown, sourceName)
  const paragraphs = []
  const sections = []
  const referenceBlocks = []
  let currentSection = null
  let inReferences = false

  for (const block of blocks) {
    if (block.startsWith('## ')) {
      const heading = block.slice(3).trim().replace(/^\*\*(.*)\*\*$/, '$1').trim()
      if (!heading || heading.startsWith('#')) {
        throw new Error(`${sourceName}: invalid section heading`)
      }
      if (heading === '參考資料') {
        if (inReferences) throw new Error(`${sourceName}: duplicate references section`)
        inReferences = true
        currentSection = null
        continue
      }
      if (inReferences) throw new Error(`${sourceName}: unexpected section after references`)
      currentSection = { heading, paragraphs: [] }
      sections.push(currentSection)
    } else if (inReferences) {
      referenceBlocks.push(block)
    } else if (currentSection) {
      currentSection.paragraphs.push(block)
    } else {
      paragraphs.push(block)
    }
  }

  return {
    title,
    paragraphs,
    sections,
    sources: parseReferences(referenceBlocks, sourceName),
    introduction: paragraphs.join('\n\n'),
  }
}

export function loadArticleMarkdown(records, modules, sourceName) {
  const markdownById = new Map()
  for (const [path, markdown] of Object.entries(modules)) {
    const id = path.match(/\/([^/]+)\.md$/)?.[1]
    if (!id || markdownById.has(id)) {
      throw new Error(`${sourceName}: invalid or duplicate article path ${path}`)
    }
    markdownById.set(id, { path, markdown })
  }

  const expectedIds = new Set(records.map(record => record.id))
  for (const id of markdownById.keys()) {
    if (!expectedIds.has(id)) {
      throw new Error(`${sourceName}: Markdown article has no matching topic ID: ${id}`)
    }
  }
  if (markdownById.size !== expectedIds.size) {
    const missing = records.filter(record => !markdownById.has(record.id)).map(record => record.id)
    throw new Error(`${sourceName}: missing Markdown articles: ${missing.join(', ')}`)
  }

  return Object.fromEntries(records.map(record => {
    const { path, markdown } = markdownById.get(record.id)
    const { title, ...articleText } = parseArticleMarkdown(markdown, path)
    if (title !== record.chineseName) {
      console.warn(`${path}: Markdown title "${title}" differs from the existing topic title "${record.chineseName}"; keeping the page title from topic data.`)
    }
    return [record.id, { ...record, ...articleText }]
  }))
}
