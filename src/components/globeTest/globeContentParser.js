function metadata(markdown, key) {
  return markdown.match(new RegExp(`^<!-- ${key}: (.*?) -->$`, 'm'))?.[1] ?? ''
}

function sections(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const result = []
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^## (.+)$/)
    if (!heading) continue
    const content = []
    for (index += 1; index < lines.length && !/^## /.test(lines[index]); index += 1) content.push(lines[index])
    while (content[0] === '') content.shift()
    while (content.at(-1) === '') content.pop()
    result.push({ heading: heading[1], content })
    index -= 1
  }
  return result
}

function parseDialogue(lines) {
  const dialogue = []
  for (const line of lines) {
    if (!line || line.startsWith('<!--') || line === '〔待補充〕') continue
    const separator = line.indexOf('：')
    if (separator < 0) {
      if (dialogue.length) dialogue.at(-1).text += `\n${line}`
      continue
    }
    dialogue.push({
      id: `message-${dialogue.length + 1}`,
      character: line.slice(0, separator),
      text: line.slice(separator + 1),
    })
  }
  return dialogue
}

export function isStoryPlayable(story) {
  return story.dialogue.length > 0
}

export function parseGlobeMarkdown(markdown, { includeStories = false } = {}) {
  const title = markdown.match(/^# (.+)$/m)?.[1] ?? ''
  const content = sections(markdown)
  const get = heading => content.find(section => section.heading === heading)?.content ?? []
  const facts = get('基本數據').flatMap(line => {
    const match = line.match(/^- \*\*(.+)\*\*：(.*)$/)
    return match ? [{ label: match[1], value: match[2] }] : []
  })
  const sources = get('參考資料').flatMap(line => {
    const match = line.match(/^- \[([^\]]+)\]\((https?:\/\/[^)]+)\)(?:\s+—\s+(.+?))?(?:｜查閱：(.+))?$/)
    return match ? [{ title: match[1], url: match[2], author: match[3] ?? '', accessedAt: match[4] ?? '' }] : []
  })
  const reserved = new Set(['副標題', '簡介', '基本數據', '參考資料', '閒聊'])
  const proseSections = content.filter(section => !reserved.has(section.heading))
  const result = {
    id: metadata(markdown, 'id'),
    name: metadata(markdown, 'name'),
    displayName: title,
    title,
    order: Number(metadata(markdown, 'order')) || 0,
    subtitle: get('副標題').join('\n'),
    introduction: get('簡介').join('\n'),
    facts,
    sections: proseSections.map(section => ({ heading: section.heading, text: section.content.join('\n') })),
    sources,
  }
  if (includeStories) result.stories = parseGlobeStories(markdown)
  return result
}

export function parseGlobeStories(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const sectionStart = lines.findIndex(line => line === '## 閒聊')
  if (sectionStart < 0) return []
  const stories = []
  for (let index = sectionStart + 1; index < lines.length; index += 1) {
    const id = lines[index].match(/^### (.+)$/)?.[1]
    if (!id) {
      if (/^## /.test(lines[index])) break
      continue
    }
    let title = ''
    let status = 'complete'
    const body = []
    for (index += 1; index < lines.length && !/^### /.test(lines[index]) && !/^## /.test(lines[index]); index += 1) {
      const titleMatch = lines[index].match(/^#### (.*)$/)
      if (titleMatch) {
        title = titleMatch[1]
        continue
      }
      const statusMatch = lines[index].match(/^<!-- status: (draft|complete) -->$/)
      if (statusMatch) {
        status = statusMatch[1]
        continue
      }
      body.push(lines[index])
    }
    index -= 1
    stories.push({
      id,
      title,
      status,
      background: null,
      dialogue: parseDialogue(body),
    })
  }
  return stories
}
