import { appearanceBootstrap } from '../../packages/design-tokens/src/appearance.ts'
import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

/** Slidev's supported index.html extension, not a replacement HTML document. */
export function renderPresentationAppearance(descriptor: PresentationDescriptor): string {
  if (descriptor.sourceKind === 'native') {
    throw new Error('Native author themes must not receive generated appearance hooks')
  }
  const readingLink = descriptor.readingUrl
    ? `<a href="${escapeHtml(descriptor.readingUrl)}">打开阅读版 ↗</a>`
    : ''
  const readingMeta = descriptor.readingUrl
    ? `<meta name="orbis:reading-url" content="${escapeHtml(descriptor.readingUrl)}">`
    : ''
  return `<head>
${readingMeta}
<script data-orbis-appearance>${appearanceBootstrap}</script>
</head>
<body>
<noscript><section class="orbis-slides-noscript"><h1>${escapeHtml(descriptor.title)}</h1><p>演示模式需要 JavaScript。${readingLink ? '你可以直接打开完整阅读版。' : '请启用 JavaScript 查看此演示。'}</p>${readingLink}</section></noscript>
</body>\n`
}
