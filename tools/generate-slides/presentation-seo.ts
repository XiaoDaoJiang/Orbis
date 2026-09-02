import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'
import {
  isPreviewRuntime,
  productionSiteUrl,
  type SiteConfig,
} from '../shared/site-config.ts'

export type PresentationSeoManifest = {
  canonicalUrl: string
  robots: 'index,follow' | 'noindex,nofollow'
}

export function buildPresentationSeoManifest(
  descriptor: PresentationDescriptor,
  config: SiteConfig,
): PresentationSeoManifest {
  const path = descriptor.sourceKind === 'brief'
    ? `/briefs/${descriptor.slug}/`
    : `/${config.presentation.publicPath}/${descriptor.slug}/`

  return {
    canonicalUrl: productionSiteUrl(config, path),
    robots: isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow',
  }
}
