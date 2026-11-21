import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { loadArticleMarkdown, parseArticleMarkdown } from './articleMarkdown.js'

// The dev-only text editor uses a browser store; keep its wrapper inert for SSR layout tests.
const server = await createServer({ plugins:[{name:'test-static-atlas-text',enforce:'pre',transform(code,id){
  if (/\/(naturalTest|humanTest|globeTest)\/Text\.jsx$/.test(id)) return {code:`import { createElement } from 'react'; export default function Text({as='span',children,htmlId}) { return createElement(as,{id:htmlId},children) }`,map:null}
}}], server: { middlewareMode:true, watch:null, hmr:false, ws:false }, appType:'custom' })
after(() => server.close())

const normalizeText = text => text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'")
const visibleMarkupText = html => normalizeText(html.replace(/<\/?(?:strong|a|em|code)\b[^>]*>/g,'').replace(/<br\s*\/?>/g,' ').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ')
const visibleMarkdownText = text => text
  .replace(/\[([^\]]+)\]\(https?:\/\/[^\s)]+\)/g,'$1')
  .replace(/\*\*(.*?)\*\*/g,'$1')
  .replace(/^#{1,3}\s+|^\s*(?:[-+*]|\d+[.)])\s+/gm,'')
  .replace(/\s+/g,' ')
  .trim()
const technologyTopics = [
  ['scientific-method','科學方法與發現'],
  ['printing','工程與技術'],
  ['electricity','能源與電力'],
  ['computers','資訊與電腦'],
  ['networks','通訊與網際網路'],
  ['space-exploration','航太與太空探索'],
]
const politicsTopics = [
  ['government','政府與治理'],
  ['laws-rights','法律與權利'],
  ['democracy','政治制度'],
  ['money-trade','貨幣與貿易'],
  ['economic-systems','經濟制度'],
  ['international-cooperation','國際關係'],
]
const plantTopics = [
  'photosynthesis',
  'flowering-plants',
  'pollinators',
  'forests',
  'fungi',
  'seeds',
]

test('all natural topic Markdown files are the displayed article prose', async () => {
  const { CATEGORIES, ENTRIES, ARTICLES } = await server.ssrLoadModule('/src/components/naturalTest/data.js')
  const { ARTICLES_BY_ID } = await server.ssrLoadModule('/src/components/naturalTest/articles.js')
  const { RESEARCH_PHOTOS } = await server.ssrLoadModule('/src/components/research/photoConfig.js')
  const { ArticleBody } = await server.ssrLoadModule('/src/components/research/ArticleContent.jsx')
  const files = readdirSync(new URL('../../../content/natural/', import.meta.url)).sort()
  assert.equal(files.length, 36)
  assert.equal(ENTRIES.length, 36)
  assert.deepEqual(new Set(files.map(file=>file.slice(0,-3))), new Set(ENTRIES.map(entry=>entry.id)))
  assert.deepEqual(CATEGORIES.find(category=>category.id==='plants').entries,plantTopics)
  for (const [id,title] of [['flowering-plants','植物的多樣性'],['pollinators','植物與傳粉']]) {
    assert.equal(ARTICLES_BY_ID[id].chineseName,title)
    assert.equal(ENTRIES.find(entry=>entry.id===id).chineseName,title)
    assert.equal(parseArticleMarkdown(readFileSync(new URL(`../../../content/natural/${id}.md`, import.meta.url),'utf8'),id).title,title)
  }
  for (const entry of ENTRIES) {
    const markdown = readFileSync(new URL(`../../../content/natural/${entry.id}.md`, import.meta.url), 'utf8')
    const article = ARTICLES[entry.article], parsed = parseArticleMarkdown(markdown, entry.id)
    assert.equal(parsed.title, markdown.match(/^# (.+)$/m)?.[1])
    assert.deepEqual(article.paragraphs, parsed.paragraphs)
    assert.deepEqual(article.sections.map(({heading,paragraphs})=>({heading,paragraphs})),parsed.sections)
    assert.ok(article.sources.length)
    assert.deepEqual(article.sources,parsed.sources)
    assert.match(markdown,/^## \*\*參考資料\*\*$/m)
    assert.equal(article.image,RESEARCH_PHOTOS.natural[entry.article]?.image ?? ARTICLES_BY_ID[entry.article].image)
    assert.equal(article.title,ARTICLES_BY_ID[entry.article].title)
    assert.ok(CATEGORIES.find(category=>category.id===entry.category).entries.includes(entry.id))
    const markup=renderToStaticMarkup(createElement(ArticleBody,{content:article}))
    assert.equal((markup.match(/<h3>/g)||[]).length,article.sections.length)
    const displayedText=visibleMarkupText(markup)
    for (const paragraph of [...article.paragraphs,...article.sections.flatMap(section=>section.paragraphs)]) {
      assert.ok(displayedText.includes(visibleMarkdownText(paragraph)),entry.id)
    }
  }
})

test('plant topic labels map to their existing Markdown articles in the same order', async () => {
  const { CATEGORIES, ENTRIES, ARTICLES } = await server.ssrLoadModule('/src/components/naturalTest/data.js')
  const { ARTICLES_BY_ID } = await server.ssrLoadModule('/src/components/naturalTest/articles.js')
  const category = CATEGORIES.find(item=>item.id==='plants')
  assert.deepEqual(category.entries,plantTopics)
  for (const [id,title] of [['flowering-plants','植物的多樣性'],['pollinators','植物與傳粉']]) {
    const entry = ENTRIES.find(item=>item.id===id)
    assert.equal(entry.category,'plants')
    assert.equal(entry.chineseName,title)
    assert.equal(ARTICLES_BY_ID[id].chineseName,title)
    assert.equal(ARTICLES[id].chineseName,title)
    assert.equal(parseArticleMarkdown(readFileSync(new URL(`../../../content/natural/${id}.md`, import.meta.url),'utf8'),id).title,title)
  }
})

test('all human topic Markdown files supply prose while special display content and metadata remain intact', async () => {
  const { CATEGORIES, ENTRIES, CONTENT } = await server.ssrLoadModule('/src/components/humanTest/data.js')
  const { ARTICLES_BY_ID } = await server.ssrLoadModule('/src/components/humanTest/articles.js')
  const { RESEARCH_PHOTOS } = await server.ssrLoadModule('/src/components/research/photoConfig.js')
  const { ArticleBody } = await server.ssrLoadModule('/src/components/research/ArticleContent.jsx')
  const files = readdirSync(new URL('../../../content/human/', import.meta.url)).sort()
  assert.equal(files.length, 35)
  assert.equal(ENTRIES.length, 35)
  assert.deepEqual(new Set(files.map(file=>file.slice(0,-3))), new Set(ENTRIES.map(entry=>entry.id)))
  assert.deepEqual(CATEGORIES.find(category=>category.id==='technology').entries,technologyTopics.map(([id])=>id))
  for (const [id,title] of technologyTopics) {
    assert.equal(ARTICLES_BY_ID[id].chineseName,title)
    assert.equal(ENTRIES.find(entry=>entry.id===id).chineseName,title)
    assert.equal(parseArticleMarkdown(readFileSync(new URL(`../../../content/human/${id}.md`, import.meta.url),'utf8'),id).title,title)
  }
  assert.deepEqual(CATEGORIES.find(category=>category.id==='politics').entries,politicsTopics.map(([id])=>id))
  for (const [id,title] of politicsTopics) {
    assert.equal(ARTICLES_BY_ID[id].chineseName,title)
    assert.equal(ENTRIES.find(entry=>entry.id===id).chineseName,title)
    assert.equal(parseArticleMarkdown(readFileSync(new URL(`../../../content/human/${id}.md`, import.meta.url),'utf8'),id).title,title)
  }
  for (const entry of ENTRIES) {
    const markdown = readFileSync(new URL(`../../../content/human/${entry.id}.md`, import.meta.url), 'utf8')
    const content = CONTENT[entry.content], parsed = parseArticleMarkdown(markdown, entry.id)
    assert.equal(parsed.title, markdown.match(/^# (.+)$/m)?.[1])
    assert.deepEqual(content.paragraphs, parsed.paragraphs)
    assert.deepEqual(content.sections.map(({heading,paragraphs})=>({heading,paragraphs})),parsed.sections)
    assert.equal(content.chineseName,entry.chineseName)
    assert.ok(content.sources.length)
    assert.deepEqual(content.sources,parsed.sources)
    assert.match(markdown,/^## \*\*參考資料\*\*$/m)
    assert.equal(content.image,RESEARCH_PHOTOS.human[entry.id]?.image ?? ARTICLES_BY_ID[entry.id].image)
    assert.equal(content.title,ARTICLES_BY_ID[entry.id].title)
    assert.ok(CATEGORIES.find(category=>category.id===entry.category).entries.includes(entry.id))
    const markup=renderToStaticMarkup(createElement(ArticleBody,{content}))
    assert.equal((markup.match(/<h3>/g)||[]).length,content.sections.length)
    const displayedText=visibleMarkupText(markup)
    for (const paragraph of [...content.paragraphs,...content.sections.flatMap(section=>section.paragraphs)]) {
      assert.ok(displayedText.includes(visibleMarkdownText(paragraph)),entry.id)
    }
  }
  assert.equal(CONTENT.timeline.steps.length,4)
  assert.equal(CONTENT.books.work.name,'Around the World in Eighty Days')
  assert.equal(CONTENT.conversation.chapter.dialogue.length,3)
})

test('ArticleBody renders multiple Markdown paragraphs in each section without changing its hierarchy', async () => {
  const { ArticleBody } = await server.ssrLoadModule('/src/components/research/ArticleContent.jsx')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { createElement } = await import('react')
  const html = renderToStaticMarkup(createElement(ArticleBody, {
    content: { paragraphs:['Introduction'], sections:[{heading:'Section',paragraphs:['First paragraph.','Second paragraph.']}] },
  }))
  assert.ok(html.includes('<p>First paragraph.</p><p>Second paragraph.</p>'))
})

test('ArticleBody renders Markdown headings, bold, links, paragraphs, and lists safely', async () => {
  const { ArticleBody } = await server.ssrLoadModule('/src/components/research/ArticleContent.jsx')
  const html = renderToStaticMarkup(createElement(ArticleBody, {
    content: {
      paragraphs:[
        '# Main heading',
        '## Middle heading',
        'A **bold phrase** and [named link](https://example.com/page), plus https://example.org/path.',
        '- First item\n- **Second item**',
        '1. Ordered first\n2. Ordered [second](https://example.net)',
        '<script>alert(1)</script>',
      ],
      sections:[{heading:'Existing section',paragraphs:['### Nested heading','Section text.']}],
    },
  }))
  assert.ok(html.includes('<h2>Main heading</h2>'))
  assert.ok(html.includes('<h3>Middle heading</h3>'))
  assert.ok(html.includes('<h4>Nested heading</h4>'))
  assert.ok(html.includes('<strong>bold phrase</strong>'))
  assert.ok(html.includes('<a href="https://example.com/page" target="_blank" rel="noopener noreferrer">named link</a>'))
  assert.ok(html.includes('<a href="https://example.org/path" target="_blank" rel="noopener noreferrer">https://example.org/path</a>.'))
  assert.ok(html.includes('<ul><li>First item</li><li><strong>Second item</strong></li></ul>'))
  assert.ok(html.includes('<ol><li>Ordered first</li><li>Ordered <a href="https://example.net" target="_blank" rel="noopener noreferrer">second</a></li></ol>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(!html.includes('<script>'))
})

test('Markdown edits replace legacy JavaScript prose while preserving topic metadata', () => {
  const record = {
    id:'sample', chineseName:'Sample topic', title:'SAMPLE TOPIC', description:'Existing description.',
    paragraphs:['Legacy introduction.'], sections:[{heading:'Legacy section',text:'Legacy text.'}],
    sources:[{url:'https://example.com'}], image:'/research-photos/sample.jpg',
  }
  const loaded = loadArticleMarkdown([record], {
    '/content/natural/sample.md':'# Sample topic\n\nEdited introduction.\n\n## Edited section\n\nEdited section text.\n\n## 參考資料\n\n- Edited source\n  - Author: New author\n  - URL: https://new.example/source\n  - Accessed: 2026-11-13\n',
  }, 'test articles').sample
  assert.deepEqual(loaded.paragraphs,['Edited introduction.'])
  assert.deepEqual(loaded.sections,[{heading:'Edited section',paragraphs:['Edited section text.']}])
  assert.deepEqual(loaded.sources,[{title:'Edited source',author:'New author',url:'https://new.example/source',accessedAt:'2026-11-13'}])
  assert.equal(loaded.title,record.title)
  assert.equal(loaded.description,record.description)
  assert.equal(loaded.image,record.image)
})

test('human Markdown without an introduction and with an edited heading still loads', () => {
  const record = {
    id:'sample', chineseName:'Original topic title', title:'ORIGINAL TOPIC', description:'Existing description.',
    paragraphs:['Legacy introduction.'], sections:[{heading:'Legacy section',text:'Legacy text.'}],
    sources:[{title:'Legacy source',url:'https://example.com'}], image:'/research-photos/sample.jpg',
  }
  const warnings = []
  const originalWarn = console.warn
  console.warn = message => warnings.push(message)
  let loaded
  try {
    loaded = loadArticleMarkdown([record], {
      '/content/human/sample.md':'# Edited topic title\n\n## First section\n\nFirst section text.\n\n## Empty section\n\n## 參考資料\n\n- Updated source\n\nhttps://updated.example/source\n',
    }, 'test articles').sample
  } finally {
    console.warn = originalWarn
  }
  assert.deepEqual(loaded.paragraphs,[])
  assert.deepEqual(loaded.sections,[
    {heading:'First section',paragraphs:['First section text.']},
    {heading:'Empty section',paragraphs:[]},
  ])
  assert.deepEqual(loaded.sources,[{title:'Updated source',url:'https://updated.example/source'}])
  assert.equal(loaded.chineseName,record.chineseName)
  assert.deepEqual(loaded.sources,parseArticleMarkdown('# Topic\n\nIntroduction.\n\n## Section\n\nText.\n\n## 參考資料\n\n- Updated source\n\nhttps://updated.example/source\n').sources)
  assert.equal(warnings.length,1)
  assert.match(warnings[0],/Markdown title "Edited topic title" differs/)
})

test('references accept name-and-URL Markdown and an empty reference section', () => {
  const parsed = parseArticleMarkdown('# Topic\n\nIntroduction.\n\n## Section\n\nSection text.\n\n## **參考資料**\n\n- Smithsonian Institution\n\nhttps://example.org/reference\n')
  assert.deepEqual(parsed.sources,[{title:'Smithsonian Institution',url:'https://example.org/reference'}])
  const empty = parseArticleMarkdown('# Topic\n\nIntroduction.\n\n## Section\n\nSection text.\n\n## 參考資料\n')
  assert.deepEqual(empty.sources,[])
})

test('Markdown references render as clickable links in the existing references area', async () => {
  const { ArticleSources } = await server.ssrLoadModule('/src/components/research/ArticleContent.jsx')
  const html = renderToStaticMarkup(createElement(ArticleSources, {
    sources:[{title:'Source title',author:'Source author',url:'https://example.org/source',accessedAt:'2026-11-13'}],
  }))
  assert.ok(html.includes('class="nt-article-sources"'))
  assert.ok(html.includes('href="https://example.org/source"'))
  assert.ok(html.includes('Source author · <a'))
  assert.ok(html.includes('<time dateTime="2026-11-13">2026-11-13</time>'))
})


test('headings without blank lines preserve prose, nested headings and inline formatting', async () => {
  const parsed = parseArticleMarkdown('# Topic\nIntro **bold**.\n## Section [link](https://example.com)\nText.\n### Nested\n- First\n- Second\n## 參考資料\n- Source\nhttps://example.org')
  const { ArticleBody } = await server.ssrLoadModule('/src/components/research/ArticleContent.jsx')
  const html = renderToStaticMarkup(createElement(ArticleBody, {content:parsed}))
  assert.ok(html.includes('<strong>bold</strong>'))
  assert.ok(html.includes('<h3>Section <a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a></h3>'))
  assert.ok(html.includes('<h4>Nested</h4>'))
  assert.ok(html.includes('<ul><li>First</li><li>Second</li></ul>'))
  assert.equal(parsed.sources[0].url, 'https://example.org')
  const links = renderToStaticMarkup(createElement(ArticleBody, {content:{paragraphs:['[Article](https://example.org/Topic_(detail)) [unsafe](javascript:alert(1))'],sections:[]}}))
  assert.ok(links.includes('href="https://example.org/Topic_(detail)"'))
  assert.ok(!links.includes('href="javascript:'))
})

test('every natural and human image appears inside the scrolling article after its title and before prose', async () => {
  for (const [dataPath,panelPath,collection,titleId] of [
    ['naturalTest/data.js','naturalTest/ReadingPanel.jsx','ARTICLES','nt-article-title'],
    ['humanTest/data.js','humanTest/HumanReadingPanel.jsx','CONTENT','ht-content-title'],
  ]) {
    const data = await server.ssrLoadModule(`/src/components/${dataPath}`)
    const {default:Panel} = await server.ssrLoadModule(`/src/components/${panelPath}`)
    for (const entry of data.ENTRIES) {
      const content = data[collection][entry.article ?? entry.content]
      const html = renderToStaticMarkup(createElement(Panel,{entry,open:true,onClose(){}}))
      assert.ok(html.includes(`id="${titleId}"`),entry.id)
      if (content.image) {
        const photo = html.indexOf('class="nt-article-photo"')
        assert.ok(photo > html.indexOf('class="nt-reading-scroll"'),entry.id)
        assert.ok(photo > html.indexOf(`id="${titleId}"`),entry.id)
        assert.ok(photo < html.indexOf('class="nt-article-body"'),entry.id)
        assert.ok(html.slice(photo).includes(`src="${content.image}"`),entry.id)
      } else {
        assert.ok(!html.includes('class="nt-article-photo"'),entry.id)
      }
      assert.ok(html.includes('class="nt-article-sources"'),entry.id)
      assert.ok(!html.includes('class="nt-student-note"'),entry.id)
    }
  }
})


test('Markdown quotes and deeper headings render semantically without losing text or safe links', async () => {
  const { ArticleBody } = await server.ssrLoadModule('/src/components/research/ArticleContent.jsx')
  const html = renderToStaticMarkup(createElement(ArticleBody, {content:{paragraphs:[
    '> First **observation**.\n>\n> Second [source](https://example.org).\n\nAfter quote.',
    '#### Detail\nText.\n##### Fine detail\nMore text.\n###### Smallest heading',
  ],sections:[]}}))
  assert.ok(html.includes('<blockquote><p>First <strong>observation</strong>.</p><p>Second <a href="https://example.org"'))
  assert.ok(html.includes('</blockquote><p>After quote.</p>'))
  assert.ok(html.includes('<h5>Detail</h5>'))
  assert.ok(html.includes('<h6>Fine detail</h6>'))
  assert.ok(html.includes('<h6>Smallest heading</h6>'))
  assert.ok(!html.includes('&gt; First'))
})

test('continents and planets share fact panels while prose and completed interactions remain available', async () => {
  const {default:ResearchNotes} = await server.ssrLoadModule('/src/components/globeTest/ResearchNotes.jsx')
  const {CONTINENTS,BODIES,STORY_GROUPS} = await server.ssrLoadModule('/src/components/globeTest/data.js')
  assert.equal(CONTINENTS.length,7)
  for (const continent of CONTINENTS) {
    const html = renderToStaticMarkup(createElement(ResearchNotes,{selected:'earth',continent:continent.id}))
    assert.ok(html.includes(`<section data-science-entry="${continent.id}" class="gt-science-introduction">`),continent.id)
    assert.equal((html.match(/class="gt-science-facts-panel"/g)||[]).length,CONTINENTS.length+BODIES.length)
    const start=html.indexOf(`data-science-entry="${continent.id}"`)
    const end=html.indexOf('data-science-entry=',start+1)
    const prose=html.slice(start,end<0?undefined:end)
    const visible=visibleMarkupText(prose)
    for (const fact of continent.facts) { assert.ok(visible.includes(fact.label)); assert.ok(visible.includes(fact.value)) }
    for (const section of continent.sections) assert.ok(visible.includes(section.text.replace(/\s+/g,' ')),continent.id)
    assert.ok(!prose.includes('class="nt-article-photo"'),continent.id)
    assert.ok(html.indexOf('gt-continent-list')<html.indexOf('data-science-entry='),continent.id)
    for (const story of STORY_GROUPS[continent.id]) {
      const button=html.match(new RegExp(`<button([^>]*)>${story.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}</button>`))
      assert.ok(button,story.id)
      assert.equal(button[1].includes('hidden'),story.dialogue.length===0,story.id)
    }
  }
})

test('presentation switches hide notes without deleting retained note data', async () => {
  const {RESEARCH_PRESENTATION}=await server.ssrLoadModule('/src/components/research/presentationFlags.js')
  const {NOTES}=await server.ssrLoadModule('/src/components/naturalTest/data.js')
  const {CONTENT}=await server.ssrLoadModule('/src/components/humanTest/data.js')
  assert.equal(RESEARCH_PRESENTATION.studentNotes,false)
  assert.equal(RESEARCH_PRESENTATION.unfinishedContent,false)
  assert.ok(Object.values(NOTES).some(note=>note.text))
  assert.ok(Object.values(CONTENT).some(content=>content.note))
})
