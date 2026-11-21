# Research article content

The Natural and Human pages load article prose from the Markdown files in `natural/` and `human/`. Each filename is the stable topic ID used by the page.

Use this format when editing an article:

```md
# Existing Chinese topic title

Introductory paragraph.

## Existing section heading

Section paragraph.

## **參考資料**

- Source title
  - Author: Source author
  - URL: https://example.org/source
  - Accessed: 2026-11-13
```

Keep a blank line between paragraphs and headings. The title must match the topic title in the page data. Each reference needs a name and URL; author and access date are optional. A simple `- Source name` followed by its URL on the next line is also supported. Keep the references section even when it is empty. References are read from Markdown and replace the old JavaScript references. Save the Markdown file in the running Vite development server to see the updated article; category, English title, description, images, and special content remain managed by the existing page data.

There are 36 Natural articles and 35 Human articles. Human timeline steps, book recommendations, and conversation content are separate special content and remain in the Human page data.

The Globe page's body and continent introductions, facts, references, and conversations are maintained in [`globe/`](./globe/README.md).

The Telescope page's character place recommendations are maintained in [`telescope/recommendations.md`](./telescope/recommendations.md). The file includes editing notes for adding characters, changing image paths, coordinates, and observation zoom.

The Big page's letters, research logs, and celestial notes are maintained in [`letters/`](./letters/README.md), [`research-logs/`](./research-logs/README.md), and [`celestial-notes/`](./celestial-notes/README.md).
