import type { WeeklyBrief } from '@orbis/content-schema'

export type WeeklyV1RenderContext = {
  siteBase: string
  readingHref: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const directionLabels = {
  rising: 'RISING',
  stable: 'STABLE',
  cooling: 'COOLING',
  'new-variable': 'NEW VARIABLE',
} as const

export function renderWeeklyV1(brief: WeeklyBrief, context: WeeklyV1RenderContext) {
  const pages: string[] = []
  const favicon = `${context.siteBase}/favicon.svg`.replace(/^\/\//, '/')
  const period = `${escapeHtml(brief.period.from)} → ${escapeHtml(brief.period.to)}`

  pages.push(`---\ntheme: default\ntitle: ${JSON.stringify(escapeHtml(brief.title))}\nlayout: orbis-cover\ntransition: fade-out\ncolorSchema: light\naspectRatio: 16/9\nfavicon: ${JSON.stringify(favicon)}\nfonts:\n  provider: none\n  sans: 'Noto Sans CJK SC, PingFang SC, Microsoft YaHei, Inter, system-ui, sans-serif'\n  mono: 'Noto Sans Mono CJK SC, ui-monospace, monospace'\nhtmlAttrs:\n  lang: zh-CN\n---\n\n<div class="eyebrow">ORBIS · WEEKLY · ${escapeHtml(brief.publishedAt)}</div>\n\n# ${escapeHtml(brief.title)}\n\n${escapeHtml(brief.summary)}\n\n<div class="weekly-period">${period}</div>\n\n[阅读版 ↗](${context.readingHref})\n`)

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">WEEKLY THESIS</div>\n\n## 本周期最重要的变化\n\n<div class="weekly-period">${period}</div>\n\n**${escapeHtml(brief.weeklyThesis)}**\n`)

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">TREND MOVEMENTS</div>\n\n## 趋势变化\n\n<div class="trend-grid">\n${brief.trendMovements.map((movement) => `<div class="trend-card"><div class="trend-direction">${directionLabels[movement.direction]}</div><h3>${escapeHtml(movement.topic)}</h3><p>${escapeHtml(movement.summary)}</p></div>`).join('\n')}\n</div>\n`)

  for (const section of brief.sections) {
    const limitations = section.limitations.length
      ? `\n\n<small>限制：${escapeHtml(section.limitations.join('；'))}</small>`
      : ''
    const source = section.references[0]
      ? `\n\n<a href="${escapeHtml(section.references[0].url)}">原始来源 ↗</a>`
      : ''

    pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">${escapeHtml(section.layout.toUpperCase())}</div>\n\n## ${escapeHtml(section.title)}\n\n**${escapeHtml(section.conclusion)}**\n\n<ul class="topic-facts">\n${section.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('\n')}\n</ul>${limitations}${source}\n`)
  }

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">NEXT PERIOD WATCH</div>\n\n## 下一周期继续观察\n\n<div class="action-grid">\n${brief.nextPeriodWatch.map((watch) => `<div class="action-card"><h3>${escapeHtml(watch.title)}</h3><p>${escapeHtml(watch.reason)}</p></div>`).join('\n')}\n</div>\n`)

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">REFERENCES</div>\n\n## References\n\n<ol class="reference-list">\n${brief.references.map((reference) => `<li><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a> — ${escapeHtml(reference.supports)}</li>`).join('\n')}\n</ol>\n\n[返回阅读版 ↗](${context.readingHref})\n`)

  return pages.join('\n\n')
}
