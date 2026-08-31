import type { DailyBrief } from '@orbis/content-schema'

export type DailyV1RenderContext = {
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

export function renderDailyV1(brief: DailyBrief, context: DailyV1RenderContext) {
  const pages: string[] = []
  const favicon = `${context.siteBase}/favicon.svg`.replace(/^\/\//, '/')

  pages.push(`---\ntheme: default\ntitle: ${JSON.stringify(brief.title)}\nlayout: orbis-cover\ntransition: fade-out\ncolorSchema: light\naspectRatio: 16/9\nfavicon: ${JSON.stringify(favicon)}\nfonts:\n  provider: none\n  sans: 'Noto Sans CJK SC, PingFang SC, Microsoft YaHei, Inter, system-ui, sans-serif'\n  mono: 'Noto Sans Mono CJK SC, ui-monospace, monospace'\nhtmlAttrs:\n  lang: zh-CN\n---\n\n<div class="eyebrow">ORBIS · ${brief.publishedAt}</div>\n\n# ${brief.title}\n\n${brief.summary}\n\n[阅读版 ↗](${context.readingHref})\n`)

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">FOUR SIGNALS</div>\n\n## 四个关键信号\n\n<div class="signal-grid">\n${brief.signals.map((signal) => `<div class="signal-card"><h3>${escapeHtml(signal.title)}</h3><p>${escapeHtml(signal.summary)}</p><small>${signal.impact.toUpperCase()}</small></div>`).join('\n')}\n</div>\n`)

  for (const section of brief.sections) {
    pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">${section.layout.toUpperCase()}</div>\n\n## ${section.title}\n\n**${section.conclusion}**\n\n<ul class="topic-facts">\n${section.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('\n')}\n</ul>\n\n${section.limitations.length ? `<small>限制：${escapeHtml(section.limitations.join('；'))}</small>` : ''}\n\n[原始来源 ↗](${section.references[0]?.url ?? brief.references[0].url})\n`)
  }

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">OPEN SOURCE RADAR</div>\n\n## 值得 Clone / Read / Test 的项目\n\n<div class="project-grid">\n${brief.projects.map((project) => `<div class="project-card"><h3>${project.action} · ${escapeHtml(project.name)}</h3><p>${escapeHtml(project.summary)}</p><p><a href="${escapeHtml(project.url)}">GitHub ↗</a></p></div>`).join('\n')}\n</div>\n`)

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">IMPACT × ADOPTION HORIZON</div>\n\n## 技术投入判断\n\n<div class="radar-list">\n${brief.radar.map((item) => `<div class="radar-item"><strong>${escapeHtml(item.label)}</strong><div class="radar-track"><span style="width:${item.impact}%"></span></div><small>${item.horizon}</small></div>`).join('\n')}\n</div>\n`)

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">FROM SIGNALS TO ACTION</div>\n\n## 从信号到行动\n\n把值得关注的变化，转化为可验证的工程选择。\n\n<div class="action-grid">\n${brief.actions.map((action) => `<div class="action-card"><h3>${escapeHtml(action.title)}</h3><p>${escapeHtml(action.description)}</p></div>`).join('\n')}\n</div>\n`)

  const archive = brief.archivePicks.length
    ? `\n\n### PART 02 · ARCHIVE PICKS / 往期推荐\n\n<ol class="reference-list">\n${brief.archivePicks.map((reference) => `<li>${reference.publishedAt ? `${reference.publishedAt} · ` : ''}<a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a> — ${escapeHtml(reference.supports)}</li>`).join('\n')}\n</ol>`
    : ''

  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">EXTENDED READING</div>\n\n## 扩展阅读\n\n### PART 01 · REFERENCES / 参考资源引用\n\n<ol class="reference-list">\n${brief.references.map((reference) => `<li><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a> — ${escapeHtml(reference.supports)}</li>`).join('\n')}\n</ol>${archive}\n\n[返回阅读版 ↗](${context.readingHref})\n`)

  return pages.join('\n\n')
}
