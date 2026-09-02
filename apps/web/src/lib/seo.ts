import {
  isPreviewRuntime,
  normalizeBasePath,
  productionSiteUrl,
  runtimeSiteUrl,
} from '../../../../tools/shared/site-config.ts'
import { webSiteConfig } from './site-config.ts'

export type SeoPageType = 'website' | 'article'

export type SeoMetadata = {
  title: string
  description: string
  canonicalUrl: string
  shareUrl: string
  imageUrl: string
  type: SeoPageType
  robots: 'index,follow' | 'noindex,nofollow'
  locale: string
  siteName: string
}

function routePathFromRuntimePathname(pathname: string, runtimeBase: string): string {
  const base = normalizeBasePath(runtimeBase)
  if (!base) return pathname || '/'
  if (pathname === base || pathname === `${base}/`) return '/'
  if (!pathname.startsWith(`${base}/`)) {
    throw new Error(`Runtime pathname ${pathname} does not start with configured base ${base}`)
  }
  return pathname.slice(base.length) || '/'
}

export async function buildSeoMetadata(input: {
  pathname: string
  runtimeBase: string
  title?: string
  description?: string
  canonicalPath?: string
  sharePath?: string
  imagePath?: string
  type?: SeoPageType
}): Promise<SeoMetadata> {
  const currentRoute = routePathFromRuntimePathname(input.pathname, input.runtimeBase)
  return {
    title: input.title ?? webSiteConfig.site.defaultTitle,
    description: input.description ?? webSiteConfig.site.defaultDescription,
    canonicalUrl: productionSiteUrl(webSiteConfig, input.canonicalPath ?? currentRoute),
    shareUrl: runtimeSiteUrl(webSiteConfig, input.sharePath ?? currentRoute),
    imageUrl: runtimeSiteUrl(webSiteConfig, input.imagePath ?? webSiteConfig.site.defaultSocialImage),
    type: input.type ?? 'website',
    robots: isPreviewRuntime(webSiteConfig) ? 'noindex,nofollow' : 'index,follow',
    locale: webSiteConfig.site.locale,
    siteName: webSiteConfig.site.brandName,
  }
}
