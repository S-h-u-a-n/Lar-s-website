import { ArticleBody } from '../research/ArticleContent'

export default function BigMarkdownBody({ content }) {
  const paragraphs = content.trim() ? content.trim().split(/\r?\n[ \t]*\r?\n/).filter(Boolean) : []
  return <ArticleBody content={{ paragraphs }} />
}
