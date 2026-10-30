// Original Traditional Chinese summaries of the sources linked per article.
// Wikipedia-derived explanatory prose: CC BY-SA 4.0; no image assets included.
export const REVIEWED_AT = '2026-10-30'
export const publicReference = (title, url, author) => ({ title, url, author, accessedAt: REVIEWED_AT })
export const reference = (title, slug = title.replaceAll(' ', '_')) => ({ title, url: `https://en.wikipedia.org/wiki/${slug}`, accessedAt: REVIEWED_AT, author: 'Wikipedia contributors' })
export const article = (id, title, chineseName, description, introduction, sources, sections) => ({
  id, title, chineseName, description, introduction, paragraphs: [introduction],
  sections: sections.map(([heading, text]) => ({ heading, text })),
  sources: sources.map(source => Array.isArray(source) ? reference(...source) : reference(source)),
  image: null, imageAlt: '',
})
