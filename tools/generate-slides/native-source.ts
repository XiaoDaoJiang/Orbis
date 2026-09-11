import type { NativePresentation } from '@orbis/content-schema/native-presentation'
import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'

export type NativePresentationDescriptorInput = {
  slug: string
  sourceDir: string
}

export function toNativePresentationDescriptor(
  presentation: NativePresentation,
  input: NativePresentationDescriptorInput,
): PresentationDescriptor {
  return {
    id: input.slug,
    slug: input.slug,
    title: presentation.title,
    publishedAt: presentation.orbis.publishedAt,
    topics: presentation.orbis.topics,
    template: 'native-slidev',
    sourceKind: 'native',
    nativeSourceDir: input.sourceDir,
    payload: presentation,
  }
}
