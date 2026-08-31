import { dailyBriefSchema } from '@orbis/content-schema'
import type { PresentationDescriptor, PresentationRenderContext } from '../presentation.ts'
import { renderDailyV1 } from './daily-v1.ts'

export type PresentationRenderer = (
  descriptor: PresentationDescriptor,
  context: PresentationRenderContext,
) => string

const renderers: Record<string, PresentationRenderer> = {
  'daily-v1': (descriptor, context) => {
    const daily = dailyBriefSchema.parse(descriptor.payload)
    if (!descriptor.readingUrl) {
      throw new Error('daily-v1 requires readingUrl')
    }

    return renderDailyV1(daily, {
      siteBase: context.siteBase,
      readingHref: descriptor.readingUrl,
    })
  },
}

export function renderPresentation(
  descriptor: PresentationDescriptor,
  context: PresentationRenderContext,
) {
  const renderer = renderers[descriptor.template]
  if (!renderer) {
    throw new Error(`Unsupported presentation template: ${descriptor.template}`)
  }

  return renderer(descriptor, context)
}
