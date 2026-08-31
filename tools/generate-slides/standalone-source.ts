import type { PresentationContent } from '@orbis/content-schema'
import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'

export type StandalonePresentationDescriptorInput = {
  slug: string
}

export function toStandalonePresentationDescriptor(
  presentation: PresentationContent,
  input: StandalonePresentationDescriptorInput,
): PresentationDescriptor {
  return {
    id: input.slug,
    slug: input.slug,
    title: presentation.title,
    publishedAt: presentation.publishedAt,
    topics: presentation.topics,
    template: presentation.template,
    sourceKind: 'presentation',
    payload: presentation,
  }
}
