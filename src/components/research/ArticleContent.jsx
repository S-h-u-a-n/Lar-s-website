// Shared only by the two research atlases; existing panels own scrolling/layout.
export function ArticleBody({ content }) {
  return <div className="nt-article-body">
    {content.paragraphs.map((text,index) => <p key={index}>{text}</p>)}
    {content.sections?.map(section => <section key={section.heading}>
      <h3>{section.heading}</h3><p>{section.text}</p>
    </section>)}
  </div>
}
export function ArticleSources({ sources }) {
  if (!sources?.length) return null
  return <footer className="nt-article-sources" aria-label="References">
    <h3>REFERENCES</h3>
    {sources.map(source => <p key={source.url}>{source.author} · <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · <time dateTime={source.accessedAt}>{source.accessedAt}</time></p>)}
    <p>科普正文依所列條目整理、改寫，採 <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>。學生筆記與示例對話另列。</p>
  </footer>
}
