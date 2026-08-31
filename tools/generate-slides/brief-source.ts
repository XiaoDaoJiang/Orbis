import type { Brief } from '@orbis/content-schema'
import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'

export type BriefPresentationDescriptorInput = {
  slug: string
  readingUrl: string
}

export function toBriefPresentationDescriptor(
  brief: Brief,
  input: BriefPresentationDescriptorInput,
): PresentationDescriptor {
  return {
    id: input.slug,
    slug: input.slug,
    title: brief.title,
    publishedAt: brief.publishedAt,
    topics: brief.topics,
    template: brief.presentation.template,
    sourceKind: 'brief',
    readingUrl: input.readingUrl,
    payload: brief,
  }
}
