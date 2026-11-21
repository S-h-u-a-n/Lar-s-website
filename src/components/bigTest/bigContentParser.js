const FRONT_MATTER = /^(?:\uFEFF)?(?:[ \t]*\r?\n)*---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
const PAGE_BREAK = /^\s*<!--\s*pagebreak\s*-->\s*$/m

function parseScalar(value, sourceName, lineNumber) {
  const scalar = value.trim()
  if (!scalar) return ''
  if (scalar.startsWith('"')) {
    try { return JSON.parse(scalar) }
    catch { throw new Error(`${sourceName}:${lineNumber}: invalid quoted YAML value`) }
  }
  if (scalar.startsWith("'")) {
    if (!scalar.endsWith("'")) throw new Error(`${sourceName}:${lineNumber}: invalid quoted YAML value`)
    return scalar.slice(1, -1).replace(/''/g, "'")
  }
  if (/^-?\d+$/.test(scalar)) return Number(scalar)
  return scalar.replace(/\s+#.*$/, '').trim()
}

function parseFrontMatter(source, sourceName) {
  const match = source.match(FRONT_MATTER)
  if (!match) throw new Error(`${sourceName}: expected YAML front matter between --- lines`)
  const metadata = {}
  for (const [index, rawLine] of match[1].split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const field = rawLine.match(/^([A-Za-z][\w-]*):(?:[ \t]*(.*))?$/)
    if (!field) throw new Error(`${sourceName}:${index + 2}: invalid YAML field`)
    if (Object.hasOwn(metadata, field[1])) throw new Error(`${sourceName}:${index + 2}: duplicate field ${field[1]}`)
    metadata[field[1]] = parseScalar(field[2] ?? '', sourceName, index + 2)
  }
  return { metadata, body: source.slice(match[0].length).replace(/^\r?\n/, '').replace(/(?:\r?\n)*$/, '') }
}

export function parseBigContentMarkdown(source, sourceName = 'Big content Markdown') {
  const { metadata, body } = parseFrontMatter(source, sourceName)
  if (typeof metadata.id !== 'string' || !metadata.id.trim()) throw new Error(`${sourceName}: id is required`)
  if (typeof metadata.title !== 'string' || !metadata.title.trim()) throw new Error(`${sourceName}: title is required`)
  if (metadata.status !== 'published' && metadata.status !== 'draft') {
    throw new Error(`${sourceName}: status must be published or draft`)
  }
  const order = metadata.order === undefined || metadata.order === '' ? 0 : metadata.order
  if (!Number.isFinite(order)) throw new Error(`${sourceName}: order must be a number`)
  const pages = body.split(PAGE_BREAK).map(page => page.trim())
  return {
    ...metadata,
    order,
    body,
    pages,
    author: metadata.author ?? '',
    from: metadata.from ?? '',
    to: metadata.to ?? '',
    date: metadata.date ?? '',
    signature: metadata.signature ?? '',
    subtitle: metadata.subtitle ?? '',
    iconAlt: metadata.iconAlt ?? metadata.title,
    status: metadata.status,
  }
}

export function loadBigContent(modules, category, icons = {}) {
  const records = []
  const ids = new Set()
  for (const [path, source] of Object.entries(modules)) {
    if (/\/readme\.md$/i.test(path)) continue
    const record = parseBigContentMarkdown(source, path)
    if (ids.has(record.id)) throw new Error(`${category}: duplicate content id "${record.id}"`)
    ids.add(record.id)
    if (record.icon) {
      const icon = icons[record.icon]
      if (!icon) throw new Error(`${path}: icon "${record.icon}" was not found in the Big letter artwork`)
      record.icon = icon
    } else {
      record.icon = null
    }
    if (record.status === 'published') records.push(record)
  }
  return records.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}
