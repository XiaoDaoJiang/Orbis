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
  }
  content: {
    briefsDir: string
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
  compatibility?: {
    legacyRootDir: string
    archiveFile: string
    rewriteBasePaths: string[]
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

export async function loadSiteConfig(): Promise<SiteConfig> {
  const path = resolve(root, 'config/site.yaml')
  const value = parse(await readFile(path, 'utf8')) as SiteConfig
  if (value?.version !== 1) throw new Error(`Unsupported site config version in ${path}`)
  if (!value.site?.origin || !value.site?.basePath) throw new Error('site.origin and site.basePath are required')
  if (!value.content?.briefsDir) throw new Error('content.briefsDir is required')
  if (!value.presentation?.generatedDir || !value.presentation?.outputDir || !value.presentation?.publicPath) {
    throw new Error('presentation paths are required')
  }
  if (value.compatibility) {
    if (!value.compatibility.legacyRootDir || !value.compatibility.archiveFile) {
      throw new Error('compatibility legacyRootDir and archiveFile are required when compatibility is enabled')
    }
    if (!Array.isArray(value.compatibility.rewriteBasePaths)) {
      throw new Error('compatibility.rewriteBasePaths must be an array')
    }
  }
  return value
}

export function runtimeSiteBase(config: SiteConfig): string {
  return normalizeBasePath(process.env.SITE_BASE ?? config.site.basePath)
}
