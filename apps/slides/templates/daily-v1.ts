import type { DailyBrief } from '@orbis/content-schema'
import { finishDeck, renderCover, renderCards, renderSection, renderReferences, page, escapeHtml, detailsMarkup, detailText, exportNotice, splitText, markedText } from './content-layout.ts'

export type DailyV1RenderContext = { siteBase: string; readingHref: string }

export function renderDailyV1(brief: DailyBrief, context: DailyV1RenderContext) {
  const pages = renderCover({ title: brief.title, summary: brief.summary, eyebrow: `ORBIS · ${brief.publishedAt}`, ...context })
  pages.push(...renderCards({ title: '四个关键信号', eyebrow: 'FOUR SIGNALS', prefix: 'signals', cards: brief.signals.map((signal) => ({ title: signal.title, text: signal.summary, label: signal.impact.toUpperCase() })), readingHref: context.readingHref }))
  brief.sections.forEach((section, index) => {
    const references = 'references' in section && Array.isArray(section.references) ? section.references : brief.references.filter((reference) => 'id' in reference && typeof reference.id === 'string' && section.facts.some((fact) => typeof fact !== 'string' && fact.evidence.includes(reference.id as string)))
    pages.push(...renderSection({ ...section, references, facts: section.facts.map((fact) => typeof fact === 'string' ? { text: fact } : { text: fact.text, links: fact.evidence.flatMap((id) => { const reference = brief.references.find((reference) => 'id' in reference && reference.id === id); return reference ? [{ url: reference.url, label: `证据 ${id}` }] : [] }) }) }, index, section.layout.toUpperCase(), context.readingHref))
  })
  pages.push(...renderCards({ title: '值得 Clone / Read / Test 的项目', eyebrow: 'OPEN SOURCE RADAR', prefix: 'projects', cards: brief.projects.map((project) => ({ title: project.name, text: project.summary, label: project.action, url: project.url })), readingHref: context.readingHref }))
  const radarRows = brief.radar.flatMap((item, index) => {
    const parts = splitText(item.label, 30)
    return parts.map((label, part) => ({ item, index, label, part: part + 1, parts: parts.length }))
  })
  for (let start = 0; start < radarRows.length; start += 3) {
    const batch = radarRows.slice(start, start + 3)
    const originals = [...new Map(batch.map((row) => [row.index, row.item])).entries()]
    const rows = batch.map(({ item, index, label, part, parts }) => `<div class="radar-item"><strong>${parts > 1 ? `<span class="radar-continuation">标签 ${part}/${parts} · ${index + 1}</span>` : ''}${markedText(`radar.${index}.label`, label, part, parts)}</strong><div class="radar-track"><span style="width:${item.impact}%"></span></div><small>影响 ${item.impact}/100<br>采用周期 ${item.horizon}/100</small></div>`).join('')
    const details = `<p>Impact 与 Adoption Horizon 均为原文的 0–100 指标。</p><ul>${originals.map(([index, item]) => `<li>${detailText(`radar.${index}.full`, item.label)} · 影响 ${item.impact}/100 · 采用周期 ${item.horizon}/100<p>${detailText(`radar.${index}.note`, item.note)}</p></li>`).join('')}</ul>`
    pages.push(page('IMPACT × ADOPTION HORIZON', '技术投入判断', `<div class="radar-list">${rows}</div>${detailsMarkup('技术投入判断', `展开 ${originals.length} 项判断`, details, context.readingHref)}${exportNotice(context.readingHref)}`, `${Math.floor(start / 3) + 1} / ${Math.ceil(radarRows.length / 3)}`))
  }
  pages.push(...renderCards({ title: '从信号到行动', eyebrow: 'FROM SIGNALS TO ACTION', prefix: 'actions', cards: brief.actions.map((action) => ({ title: action.title, text: action.description })), readingHref: context.readingHref }))
  pages.push(...renderReferences('参考资源引用', brief.references, 'references', context.readingHref))
  pages.push(...renderReferences('往期推荐', brief.archivePicks, 'archivePicks', context.readingHref))
  return finishDeck(pages, context.readingHref)
}
