import type { PresentationContent } from '@orbis/content-schema'
import type { PresentationDescriptor, PresentationRenderContext } from '../presentation.ts'
import { finishDeck, renderCover, renderSection, renderReferences } from './content-layout.ts'

export function renderTalkV1(talk: PresentationContent, descriptor: PresentationDescriptor, context: PresentationRenderContext) {
  const pages = renderCover({ title: talk.title, summary: talk.summary, eyebrow: `ORBIS · TALK · ${talk.publishedAt}`, siteBase: context.siteBase, readingHref: descriptor.readingUrl })
  talk.sections.forEach((section, index) => pages.push(...renderSection({ ...section, facts: section.facts.map((text) => ({ text })) }, index, section.layout.toUpperCase(), descriptor.readingUrl)))
  pages.push(...renderReferences('References', talk.references, 'references', descriptor.readingUrl))
  return finishDeck(pages, descriptor.readingUrl, context.presentationHref ?? `${context.siteBase}/slides/${descriptor.slug}/`)
}
