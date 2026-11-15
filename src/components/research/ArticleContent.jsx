import './ArticleContent.css'

// Shared only by the two research atlases; existing panels own scrolling/layout.
const inlinePattern = /\[([^\]]+)\]\((https?:\/\/(?:[^\s()]|\([^\s()]*\))+)\)|\*\*(.+?)\*\*|(https?:\/\/[^\s<]+)/
const trailingUrlPunctuation = /[.,!?;:，。！？、）】」』]+$/

function renderInline(text, keyPrefix) {
  const nodes = []
  const matcher = new RegExp(inlinePattern.source, 'g')
  let cursor = 0, match, index = 0

  while ((match = matcher.exec(text)) !== null) {
    let end = match.index + match[0].length
    const urlText = match[4]
    let punctuation = ''
    if (urlText) {
      punctuation = urlText.match(trailingUrlPunctuation)?.[0] ?? ''
      end -= punctuation.length
    }

    if (match.index > cursor) nodes.push(text.slice(cursor, match.index))
    if (match[1]) {
      nodes.push(<a key={`${keyPrefix}-${index++}`} href={match[2]} target="_blank" rel="noopener noreferrer">{renderInline(match[1], `${keyPrefix}-link`)}</a>)
    } else if (match[3]) {
      nodes.push(<strong key={`${keyPrefix}-${index++}`}>{renderInline(match[3], `${keyPrefix}-bold`)}</strong>)
    } else if (urlText) {
      const url = urlText.slice(0, end - match.index)
      nodes.push(<a key={`${keyPrefix}-${index++}`} href={url} target="_blank" rel="noopener noreferrer">{url}</a>)
      if (punctuation) nodes.push(punctuation)
    }
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function renderMarkdownBlock(text, key) {
  const lines = text.split(/\r?\n/)
  const elements = []
  let paragraph = [], listItems = [], listType = null, quote = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    elements.push(<p key={`${key}-p-${elements.length}`}>{paragraph.flatMap((line,index) => index ? [<br key={`${key}-br-${index}`}/>, ...renderInline(line, `${key}-line-${index}`)] : renderInline(line, `${key}-line-${index}`))}</p>)
    paragraph = []
  }
  const flushList = () => {
    if (!listItems.length) return
    const List = listType === 'ordered' ? 'ol' : 'ul'
    elements.push(<List key={`${key}-list-${elements.length}`}>{listItems.map((item,index) => <li key={`${key}-item-${index}`}>{renderInline(item, `${key}-item-${index}`)}</li>)}</List>)
    listItems = []
    listType = null
  }

  const flushQuote = () => {
    if (!quote.length) return
    const quoteKey = `${key}-quote-${elements.length}`
    elements.push(<blockquote key={quoteKey}>{renderMarkdownBlock(quote.join('\n'), quoteKey)}</blockquote>)
    quote = []
  }

  for (const [index,line] of lines.entries()) {
    const quoteLine = line.match(/^\s*>\s?(.*)$/)
    if (quoteLine) {
      flushParagraph()
      flushList()
      quote.push(quoteLine[1])
      continue
    }
    flushQuote()
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    const unorderedItem = line.match(/^\s*[-+*]\s+(.+)$/)
    const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const Tag = `h${Math.min(heading[1].length + 1, 6)}`
      elements.push(<Tag key={`${key}-heading-${index}`}>{renderInline(heading[2], `${key}-heading-${index}`)}</Tag>)
    } else if (unorderedItem || orderedItem) {
      flushParagraph()
      const nextType = orderedItem ? 'ordered' : 'unordered'
      if (listType && listType !== nextType) flushList()
      listType = nextType
      listItems.push((unorderedItem ?? orderedItem)[1])
    } else {
      flushList()
      if (line.trim()) paragraph.push(line)
      else flushParagraph()
    }
  }

  flushParagraph()
  flushList()
  flushQuote()
  return elements
}

export function ArticleBody({ content }) {
  return <div className="nt-article-body">
    {content.paragraphs.flatMap((text,index) => renderMarkdownBlock(text, `intro-${index}`))}
    {content.sections?.map(section => <section key={section.heading}>
      <h3>{renderInline(section.heading, `section-${section.heading}`)}</h3>
      {(section.paragraphs || [section.text]).flatMap((text,index) => renderMarkdownBlock(text, `${section.heading}-${index}`))}
    </section>)}
  </div>
}
export function ArticleSources({ sources }) {
  if (!sources?.length) return null
  return <footer className="nt-article-sources" aria-label="References">
    <h3>REFERENCES</h3>
    {sources.map((source,index) => <p key={`${source.url}-${index}`}>{source.author && <>{source.author} · </>}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>{source.accessedAt && <> · <time dateTime={source.accessedAt}>{source.accessedAt}</time></>}</p>)}
    <p>科普正文依所列條目整理、改寫，採 <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>。學生筆記與示例對話另列。</p>
  </footer>
}
