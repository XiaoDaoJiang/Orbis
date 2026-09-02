import type { ResolvedAuthor } from './content-registry.ts'
import { webSiteConfig } from './site-config.ts'
import { productionSiteUrl } from '../../../../tools/shared/site-config.ts'

export type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>

function canonicalUrl(path: string): string {
  return productionSiteUrl(webSiteConfig, path)
}

function baseDocument(type: 'Article' | 'TechArticle', input: {
  title: string
  description: string
  publishedAt: string
  canonicalPath: string
}): Record<string, unknown> {
  const url = canonicalUrl(input.canonicalPath)
  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: input.title,
    description: input.description,
    datePublished: input.publishedAt,
    mainEntityOfPage: url,
    url,
    inLanguage: webSiteConfig.site.locale,
  }
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: webSiteConfig.site.brandName,
    url: canonicalUrl('/'),
    description: webSiteConfig.site.defaultDescription,
    inLanguage: webSiteConfig.site.locale,
  }
}

export function buildEssayJsonLd(input: {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  canonicalPath: string
  authors: ResolvedAuthor[]
}): Record<string, unknown> {
  return {
    ...baseDocument('Article', input),
    dateModified: input.updatedAt ?? input.publishedAt,
    author: input.authors.map((author) => ({
      '@type': 'Person',
      name: author.name,
      ...(author.url ? { url: author.url } : {}),
    })),
  }
}

export function buildBriefJsonLd(input: {
  title: string
  description: string
  publishedAt: string
  canonicalPath: string
}): Record<string, unknown> {
  return baseDocument('Article', input)
}

export function buildKnowledgeJsonLd(input: {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  canonicalPath: string
}): Record<string, unknown> {
  return {
    ...baseDocument('TechArticle', input),
    dateModified: input.updatedAt ?? input.publishedAt,
  }
}

export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}
