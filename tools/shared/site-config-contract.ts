/** Pure configuration contract, shared by the YAML loader and dependency-free tests. */
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
  content: { briefsDir: string; presentationsDir: string }
  presentation: { generatedDir: string; outputDir: string; publicPath: string }
  preview: { provider: string; origin: string; repositoryPath: string; branchPrefix: string }
}

function record(value: unknown, field: string, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object`)
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new Error(`Unknown configuration field: ${field}.${key}`)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, field: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value !== value.trim()) {
    throw new Error(`${field} must be ${allowEmpty ? 'a' : 'a non-empty'} string without surrounding whitespace`)
  }
  return value
}

/** URL paths and filesystem paths deliberately have different validation rules. */
export function normalizeBasePath(value: string): string {
  text(value, 'URL base path', true)
  if (value === '' || value === '/') return ''
  if (!value.startsWith('/') || /[\\?#\x00-\x20]/u.test(value) || value.includes('//')) {
    throw new Error(`URL base path must be an absolute pathname, not a URL: ${value}`)
  }
  const normalized = value.replace(/\/$/, '')
  for (const segment of normalized.slice(1).split('/')) {
    let decoded: string
    try { decoded = decodeURIComponent(segment) } catch { throw new Error(`Invalid URL path encoding: ${value}`) }
    if (decoded === '.' || decoded === '..' || /[\\/?#%\x00-\x1f]/u.test(decoded)) {
      throw new Error(`Unsafe URL path segment: ${value}`)
    }
  }
  return normalized
}

export function joinBasePath(...segments: string[]): string {
  const normalized = segments.map((segment) => segment.replace(/^\/+|\/+$/g, '')).filter(Boolean)
  return `/${normalized.join('/')}`
}

export function normalizeSiteOrigin(value: string): string {
  text(value, 'Site origin')
  let url: URL
  try { url = new URL(value) } catch { throw new Error(`Site origin must be an absolute HTTP(S) URL: ${value}`) }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`Site origin must use HTTP(S): ${value}`)
  if (url.username || url.password) throw new Error('Site origin must not contain credentials')
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
    throw new Error(`Site origin must not contain a path, query, or hash: ${value}`)
  }
  return url.origin
}

export function absoluteSiteUrl(origin: string, basePath: string, routePath: string): string {
  const normalizedOrigin = normalizeSiteOrigin(origin)
  const normalizedBase = normalizeBasePath(basePath)
  const trailing = routePath === '/' || routePath.endsWith('/')
  const joined = joinBasePath(normalizedBase, routePath)
  const pathname = joined === '/' ? '/' : trailing ? `${joined}/` : joined
  return new URL(pathname, `${normalizedOrigin}/`).href
}

function portableRelativePath(value: unknown, field: string): string {
  const path = text(value, field)
  const invalid = /[\\:<>"|?*\x00-\x1f]/u
  for (const segment of path.split('/')) {
    if (!segment || segment === '.' || segment === '..' || invalid.test(segment) || /[. ]$/.test(segment)
      || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment)) {
      throw new Error(`${field} must be a portable repository-relative path without traversal: ${path}`)
    }
  }
  return path
}

function overlaps(a: string, b: string): boolean {
  a = a.toLowerCase()
  b = b.toLowerCase()
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)
}

export function validateSiteConfig(value: unknown, source = 'site config'): SiteConfig {
  const config = record(value, source, ['version', 'site', 'content', 'presentation', 'preview'])
  if (config.version !== 1) throw new Error(`Unsupported site config version in ${source}`)
  const site = record(config.site, 'site', ['name', 'origin', 'basePath', 'locale', 'defaultTitle', 'defaultDescription', 'defaultSocialImage', 'brandName'])
  for (const field of ['name', 'locale', 'defaultTitle', 'defaultDescription', 'brandName']) text(site[field], `site.${field}`)
  normalizeSiteOrigin(text(site.origin, 'site.origin'))
  normalizeBasePath(text(site.basePath, 'site.basePath', true))
  const image = text(site.defaultSocialImage, 'site.defaultSocialImage')
  if (!normalizeBasePath(image)) throw new Error('site.defaultSocialImage must identify a site-local image')

  const content = record(config.content, 'content', ['briefsDir', 'presentationsDir'])
  const briefs = portableRelativePath(content.briefsDir, 'content.briefsDir')
  const presentations = portableRelativePath(content.presentationsDir, 'content.presentationsDir')
  if (!briefs.startsWith('content/') || !presentations.startsWith('content/') || overlaps(briefs, presentations)) {
    throw new Error('Content directories must be distinct, non-overlapping children of content/')
  }

  const presentation = record(config.presentation, 'presentation', ['generatedDir', 'outputDir', 'publicPath'])
  const generated = portableRelativePath(presentation.generatedDir, 'presentation.generatedDir')
  const output = portableRelativePath(presentation.outputDir, 'presentation.outputDir')
  // Generated relative imports, Path Guard and CODEOWNERS share this V1 boundary.
  if (generated !== 'apps/slides/generated') throw new Error('presentation.generatedDir must be apps/slides/generated for the V1 layout')
  if (!output.startsWith('dist/') || ['dist/web', 'dist/site'].some((reserved) => overlaps(output, reserved))) {
    throw new Error('presentation.outputDir must be inside dist/ and must not overlap dist/web or dist/site')
  }
  portableRelativePath(presentation.publicPath, 'presentation.publicPath')
  const preview = record(config.preview, 'preview', ['provider', 'origin', 'repositoryPath', 'branchPrefix'])
  text(preview.provider, 'preview.provider')
  normalizeSiteOrigin(text(preview.origin, 'preview.origin'))
  if (!normalizeBasePath(text(preview.repositoryPath, 'preview.repositoryPath'))) throw new Error('preview.repositoryPath must not be the root path')
  const prefix = text(preview.branchPrefix, 'preview.branchPrefix')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(prefix)) throw new Error('preview.branchPrefix must be a lowercase branch-name prefix')
  return value as SiteConfig
}
