import { parse } from 'yaml'
import siteConfigSource from '../../../../config/site.yaml?raw'
import {
  isPreviewRuntime,
  normalizeBasePath,
  productionSiteUrl,
  runtimeSiteUrl,
  validateSiteConfig,
} from '../../../../tools/shared/site-config.ts'
import type { SiteConfig } from '../../../../tools/shared/site-config.ts'

const config = validateSiteConfig(parse(siteConfigSource) as SiteConfig, 'config/site.yaml')

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
    title: input.title ?? config.site.defaultTitle,
    description: input.description ?? config.site.defaultDescription,
    canonicalUrl: productionSiteUrl(config, input.canonicalPath ?? currentRoute),
    shareUrl: runtimeSiteUrl(config, input.sharePath ?? currentRoute),
    imageUrl: runtimeSiteUrl(config, input.imagePath ?? config.site.defaultSocialImage),
    type: input.type ?? 'website',
    robots: isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow',
    locale: config.site.locale,
    siteName: config.site.brandName,
  }
}
