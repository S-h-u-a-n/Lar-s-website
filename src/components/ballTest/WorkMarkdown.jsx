function parseInline(text, keyPrefix) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/\S+)/g).filter(Boolean)
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    if (/^https?:\/\/\S+$/.test(token)) return <a key={key} href={token} target="_blank" rel="noreferrer">{token}</a>
    const bold = token.match(/^\*\*([^*]+)\*\*$/)
    if (bold) return <strong key={key}>{bold[1]}</strong>
    return token
  })
}

function parseBlocks(markdown) {
  const blocks = []
  const lines = markdown.replace(/\r\n/g, '\n').trim().split('\n')
  let paragraph = [], list = []
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', lines: paragraph })
    paragraph = []
  }
  const flushList = () => {
    if (list.length) blocks.push({ type: 'list', items: list })
    list = []
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    const item = line.match(/^\s*[-*+]\s+(.+)$/)
    if (!line.trim()) {
      flushParagraph()
      flushList()
    } else if (/^\s*---+\s*$/.test(line)) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'rule' })
    } else if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
    } else if (item) {
      flushParagraph()
      list.push(item[1])
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  const grouped = []
  let inCopyrightSection = false
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (block.type === 'heading') {
      inCopyrightSection = block.level >= 3 && block.text.replace(/^\*\*(.*)\*\*$/, '$1').trim() === '作品資訊與版權'
    }
    if (inCopyrightSection && block.type === 'paragraph' && block.lines.length === 1 && /^\*\*原作權利：\*\*$/.test(block.lines[0])) {
      const paragraphs = [block]
      while (blocks[index + 1]?.type === 'paragraph' && !/^\*\*[^*]+\*\*$/.test(blocks[index + 1].lines[0] ?? '')) {
        paragraphs.push(blocks[++index])
      }
      grouped.push({ type: 'legal-note', paragraphs })
      continue
    }
    const fact = block.type === 'paragraph' && block.lines.length === 1 && !block.lines[0].startsWith('**')
      ? block.lines[0].match(/^([^：:]+)：\s*(.+)$/)
      : null
    if (fact) {
      const previous = grouped.at(-1)
      if (previous?.type === 'facts') previous.items.push(fact.slice(1))
      else grouped.push({ type: 'facts', items: [fact.slice(1)] })
    } else {
      grouped.push(block)
    }
  }
  return grouped
}

export default function WorkMarkdown({ markdown }) {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    throw new Error('Ball work Markdown is missing or empty.')
  }
  return <article className="ball-work-markdown">
    {parseBlocks(markdown).map((block, index) => {
      if (block.type === 'rule') return <hr key={index}/>
      if (block.type === 'list') return <ul key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{parseInline(item, `${index}-${itemIndex}`)}</li>)}</ul>
      if (block.type === 'facts') return <div className="ball-work-facts" key={index}>{block.items.map(([label, value]) => <p key={label}><strong>{label}：</strong>{parseInline(value, `${index}-${label}`)}</p>)}</div>
      if (block.type === 'legal-note') return <div className="ball-work-legal-note" key={index}>{block.paragraphs.map((paragraph, paragraphIndex) => <p className={paragraphIndex === 0 ? 'ball-work-kicker' : undefined} key={paragraphIndex}>{paragraph.lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br/>}{parseInline(line, `${index}-${paragraphIndex}-${lineIndex}`)}</span>)}</p>)}</div>
      if (block.type === 'heading') {
        const Tag = `h${block.level}`
        return <Tag id={block.level === 1 ? 'ball-work-title' : undefined} className={block.level === 1 ? 'ball-work-markdown-title' : undefined} key={index}>{parseInline(block.text, `${index}`)}</Tag>
      }
      const { lines } = block
      const kicker = lines.length === 1 && /^\*\*[^*]+\*\*$/.test(lines[0])
      return <p className={kicker ? 'ball-work-kicker' : undefined} key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br/>}{parseInline(line, `${index}-${lineIndex}`)}</span>)}</p>
    })}
  </article>
}
