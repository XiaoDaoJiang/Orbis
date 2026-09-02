import type { ResolvedAuthor } from './content-registry.ts'
import { productionSiteUrl, type SiteConfig } from '../../../../tools/shared/site-config.ts'

export type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>

function canonicalUrl(config: SiteConfig, path: string): string {
  return productionSiteUrl(config, path)
}

function baseDocument(config: SiteConfig, type: 'Article' | 'TechArticle', input: {
  title: string
  description: string
  publishedAt: string
  canonicalPath: string
}): Record<string, unknown> {
  const url = canonicalUrl(config, input.canonicalPath)
  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: input.title,
    description: input.description,
    datePublished: input.publishedAt,
    mainEntityOfPage: url,
    url,
    inLanguage: config.site.locale,
  }
}

export function buildWebSiteJsonLd(config: SiteConfig): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.site.brandName,
    url: canonicalUrl(config, '/'),
    description: config.site.defaultDescription,
    inLanguage: config.site.locale,
  }
}

export function buildEssayJsonLd(config: SiteConfig, input: {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  canonicalPath: string
  authors: ResolvedAuthor[]
}): Record<string, unknown> {
  return {
    ...baseDocument(config, 'Article', input),
    dateModified: input.updatedAt ?? input.publishedAt,
    author: input.authors.map((author) => ({
      '@type': 'Person',
      name: author.name,
      ...(author.url ? { url: author.url } : {}),
    })),
  }
}

export function buildBriefJsonLd(config: SiteConfig, input: {
  title: string
  description: string
  publishedAt: string
  canonicalPath: string
}): Record<string, unknown> {
  return baseDocument(config, 'Article', input)
}

export function buildKnowledgeJsonLd(config: SiteConfig, input: {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  canonicalPath: string
}): Record<string, unknown> {
  return {
    ...baseDocument(config, 'TechArticle', input),
    dateModified: input.updatedAt ?? input.publishedAt,
  }
}

export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}
