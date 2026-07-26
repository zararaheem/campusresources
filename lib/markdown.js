import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: false,
});

// Content is authored only by allowlisted editors, so we render trusted Markdown.
export function renderMarkdown(md) {
  if (!md) return '';
  return marked.parse(md);
}
