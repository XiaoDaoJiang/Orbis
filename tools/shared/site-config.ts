import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { absoluteSiteUrl, normalizeBasePath, normalizeSiteOrigin, validateSiteConfig, type SiteConfig } from './site-config-contract.ts'

export { absoluteSiteUrl, joinBasePath, normalizeBasePath, normalizeSiteOrigin, validateSiteConfig, type SiteConfig } from './site-config-contract.ts'

const root = resolve(import.meta.dirname, '../..')

export async function loadSiteConfig(): Promise<SiteConfig> {
  const path = resolve(root, 'config/site.yaml')
  const value: unknown = parse(await readFile(path, 'utf8'))
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
