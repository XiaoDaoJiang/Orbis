import type { PresentationContent } from '@orbis/content-schema'
import type { PresentationDescriptor, PresentationRenderContext } from '../presentation.ts'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function renderTalkV1(
  talk: PresentationContent,
  descriptor: PresentationDescriptor,
  context: PresentationRenderContext,
) {
  const pages: string[] = []
  const favicon = `${context.siteBase}/favicon.svg`.replace(/^\/\//, '/')
  const readingLink = descriptor.readingUrl ? `\n\n[Reading ↗](${descriptor.readingUrl})` : ''

  pages.push(`---\ntheme: default\ntitle: ${JSON.stringify(escapeHtml(talk.title))}\nlayout: orbis-cover\ntransition: fade-out\ncolorSchema: light\naspectRatio: 16/9\nfavicon: ${JSON.stringify(favicon)}\nfonts:\n  provider: none\n  sans: 'Noto Sans CJK SC, PingFang SC, Microsoft YaHei, Inter, system-ui, sans-serif'\n  mono: 'Noto Sans Mono CJK SC, ui-monospace, monospace'\nhtmlAttrs:\n  lang: zh-CN\n---\n\n<div class="eyebrow">ORBIS · TALK · ${escapeHtml(talk.publishedAt)}</div>\n\n# ${escapeHtml(talk.title)}\n\n${escapeHtml(talk.summary)}${readingLink}\n`)

  for (const section of talk.sections) {
    const limitations = section.limitations.length
      ? `\n\n<small>限制：${escapeHtml(section.limitations.join('；'))}</small>`
      : ''
    const references = section.references.length
      ? `\n\n<ol class="reference-list">\n${section.references.map((reference) => `<li><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a> — ${escapeHtml(reference.supports)}</li>`).join('\n')}\n</ol>`
      : ''

    pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">${section.layout.toUpperCase()}</div>\n\n## ${escapeHtml(section.title)}\n\n**${escapeHtml(section.conclusion)}**\n\n<ul class="topic-facts">\n${section.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('\n')}\n</ul>${limitations}${references}\n`)
  }

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">REFERENCES</div>\n\n## References\n\n<ol class="reference-list">\n${talk.references.map((reference) => `<li><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a> — ${escapeHtml(reference.supports)}</li>`).join('\n')}\n</ol>${readingLink}\n`)

  return pages.join('\n\n')
}
