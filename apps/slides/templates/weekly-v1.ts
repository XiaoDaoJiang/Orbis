import type { WeeklyBrief } from '@orbis/content-schema'
import { finishDeck, renderCover, renderCards, renderSection, renderReferences, renderFocusPages } from './content-layout.ts'

export type WeeklyV1RenderContext = { siteBase: string; readingHref: string }
const directionLabels = { rising: 'RISING', stable: 'STABLE', cooling: 'COOLING', 'new-variable': 'NEW VARIABLE' } as const

export function renderWeeklyV1(brief: WeeklyBrief, context: WeeklyV1RenderContext) {
  const pages = renderCover({ title: brief.title, summary: brief.summary, eyebrow: `ORBIS · WEEKLY · ${brief.publishedAt}`, metadata: `${brief.period.from} → ${brief.period.to}`, ...context })
  pages.push(...renderFocusPages({ id: 'weeklyThesis', title: '本周期最重要的变化', eyebrow: 'WEEKLY THESIS', readingHref: context.readingHref, blocks: [{ id: 'weeklyThesis.text', label: '核心判断', text: brief.weeklyThesis }] }))
  pages.push(...renderCards({ title: '趋势变化', eyebrow: 'TREND MOVEMENTS', prefix: 'trendMovements', cards: brief.trendMovements.map((movement) => ({ title: movement.topic, text: movement.summary, label: directionLabels[movement.direction] })), readingHref: context.readingHref }))
  brief.sections.forEach((section, index) => pages.push(...renderSection({ ...section, facts: section.facts.map((text) => ({ text })) }, index, section.layout.toUpperCase(), context.readingHref)))
  pages.push(...renderCards({ title: '下一周期继续观察', eyebrow: 'NEXT PERIOD WATCH', prefix: 'nextPeriodWatch', cards: brief.nextPeriodWatch.map((watch) => ({ title: watch.title, text: watch.reason })), readingHref: context.readingHref }))
  pages.push(...renderReferences('References', brief.references, 'references', context.readingHref))
  return finishDeck(pages, context.readingHref)
}
