import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const root = resolve(import.meta.dirname, '../..')

export type SiteConfig = {
  version: number
  site: {
    name: string
    origin: string
    basePath: string
    locale: string
    defaultTitle: string
    defaultDescription: string
    defaultSocialImage: string
    brandName: string
  }
  content: {
    briefsDir: string
    presentationsDir: string
  }
  presentation: {
    generatedDir: string
    outputDir: string
    publicPath: string
  }
  preview: {
    provider: string
    origin: string
    repositoryPath: string
    branchPrefix: string
  }
}

export function normalizeBasePath(value: string): string {
  if (!value || value === '/') return ''
  return `/${value.replace(/^\/+|\/+$/g, '')}`
}

export function joinBasePath(...segments: string[]): string {
  const normalized = segments
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
  return `/${normalized.join('/')}`
}

export function normalizeSiteOrigin(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`Site origin must be an absolute HTTP(S) URL: ${value}`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Site origin must use HTTP(S): ${value}`)
  }
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
    throw new Error(`Site origin must not contain a path, query, or hash: ${value}`)
  }
  return url.origin
}

export function absoluteSiteUrl(origin: string, basePath: string, routePath: string): string {
  const normalizedOrigin = normalizeSiteOrigin(origin)
  const normalizedBase = normalizeBasePath(basePath)
  const wantsTrailingSlash = routePath === '/' || routePath.endsWith('/')
  const joined = joinBasePath(normalizedBase, routePath)
  const pathname = joined === '/' ? '/' : wantsTrailingSlash ? `${joined}/` : joined
  return new URL(pathname, `${normalizedOrigin}/`).href
}

export function validateSiteConfig(value: SiteConfig, source = 'site config'): SiteConfig {
  if (value?.version !== 1) throw new Error(`Unsupported site config version in ${source}`)
  if (!value.site?.origin || !value.site?.basePath) throw new Error('site.origin and site.basePath are required')
  if (!value.site?.name || !value.site?.locale || !value.site?.defaultTitle || !value.site?.defaultDescription || !value.site?.defaultSocialImage || !value.site?.brandName) {
    throw new Error('site metadata is required')
  }
  normalizeSiteOrigin(value.site.origin)
  if (!value.content?.briefsDir || !value.content?.presentationsDir) {
    throw new Error('content.briefsDir and content.presentationsDir are required')
  }
  if (!value.presentation?.generatedDir || !value.presentation?.outputDir || !value.presentation?.publicPath) {
    throw new Error('presentation paths are required')
  }
  if (!value.preview?.origin || !value.preview?.repositoryPath || !value.preview?.branchPrefix) {
    throw new Error('preview configuration is required')
  }
  normalizeSiteOrigin(value.preview.origin)
  return value
}

export async function loadSiteConfig(): Promise<SiteConfig> {
  const path = resolve(root, 'config/site.yaml')
  const value = parse(await readFile(path, 'utf8')) as SiteConfig
  return validateSiteConfig(value, path)
}

export function runtimeSiteBase(config: SiteConfig): string {
  return normalizeBasePath(process.env.SITE_BASE ?? config.site.basePath)
}

export function productionSiteUrl(config: SiteConfig, routePath: string): string {
  return absoluteSiteUrl(config.site.origin, config.site.basePath, routePath)
}

export function runtimeSiteOrigin(config: SiteConfig): string {
  return normalizeSiteOrigin(process.env.SITE_ORIGIN ?? config.site.origin)
}

export function runtimeSiteUrl(config: SiteConfig, routePath: string): string {
  return absoluteSiteUrl(runtimeSiteOrigin(config), runtimeSiteBase(config), routePath)
}

export function isPreviewRuntime(config: SiteConfig): boolean {
  return runtimeSiteOrigin(config) !== normalizeSiteOrigin(config.site.origin)
    || runtimeSiteBase(config) !== normalizeBasePath(config.site.basePath)
}
