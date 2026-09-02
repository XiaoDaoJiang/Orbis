import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import {
  isPreviewRuntime,
  joinBasePath,
  loadSiteConfig,
  productionSiteUrl,
  runtimeSiteBase,
} from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const web = resolve(root, 'dist/web')
const slides = resolve(root, 'dist/slides')
const site = resolve(root, 'dist/site')

type ArchiveIssue = {
  date: string
  title: string
  path: string
  topics: string[]
}

type Archive = {
  latest: string
  issues: ArchiveIssue[]
}

function safeRelativePath(value: string): string {
  const normalized = value.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')
  if (!normalized || normalized.split('/').includes('..')) throw new Error(`Unsafe public path: ${value}`)
  return normalized
}

function dailyPath(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid Daily date: ${date}`)
  return `${date.replaceAll('-', '/')}/`
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function redirectHtml(
  target: string,
  canonicalUrl: string,
  robots: 'index,follow' | 'noindex,nofollow',
): string {
  const jsTarget = JSON.stringify(target)
  const escapedTarget = escapeHtmlAttribute(target)
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Orbis · Redirect</title><link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}"><meta name="robots" content="${robots}"><script>const q=location.search||'';location.replace(${jsTarget}+q)</script><noscript><meta http-equiv="refresh" content="0;url=${escapedTarget}"></noscript></head><body></body></html>`
}

await rm(site, { recursive: true, force: true })
await mkdir(site, { recursive: true })
await cp(web, site, { recursive: true })
await cp(slides, resolve(site, config.presentation.publicPath), { recursive: true })

const siteBase = runtimeSiteBase(config)
const robots = isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow'
const issues: ArchiveIssue[] = []
const dailyDates = new Set<string>()
const canonicalByDate = new Map<string, string>()
const briefFiles = await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])

for (const file of briefFiles) {
  const brief = briefSchema.parse(await readYaml(file))
  if (brief.status !== 'published' || brief.cadence !== 'daily') continue
  if (dailyDates.has(brief.publishedAt)) throw new Error(`Multiple published Daily briefs share date ${brief.publishedAt}`)
  dailyDates.add(brief.publishedAt)

  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  const publicPath = dailyPath(brief.publishedAt)
  const destination = resolve(site, safeRelativePath(publicPath))
  const target = brief.presentation.enabled
    ? `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
    : `${joinBasePath(siteBase, 'briefs', slug)}/`
  const canonicalUrl = productionSiteUrl(config, `/briefs/${slug}/`)
  canonicalByDate.set(brief.publishedAt, canonicalUrl)

  await mkdir(destination, { recursive: true })
  await writeFile(resolve(destination, 'index.html'), redirectHtml(target, canonicalUrl, robots), 'utf8')

  issues.push({
    date: brief.publishedAt,
    title: brief.title,
    path: publicPath,
    topics: brief.topics,
  })
  console.log(`Added structured Daily route: /${publicPath} -> ${target}`)
}

issues.sort((left, right) => right.date.localeCompare(left.date))
if (issues.length === 0) throw new Error('At least one published Daily brief is required to build archive/latest routes')

const archive: Archive = { latest: issues[0].date, issues }
await writeFile(resolve(site, 'archive.json'), `${JSON.stringify(archive, null, 2)}\n`, 'utf8')

const latestTarget = `${joinBasePath(siteBase, issues[0].path)}/`
const latestCanonical = canonicalByDate.get(issues[0].date)
if (!latestCanonical) throw new Error(`Missing canonical URL for latest Daily: ${issues[0].date}`)
const latestDestination = resolve(site, 'latest')
await mkdir(latestDestination, { recursive: true })
await writeFile(resolve(latestDestination, 'index.html'), redirectHtml(latestTarget, latestCanonical, robots), 'utf8')

console.log(`Generated structured archive/latest: ${archive.latest} -> ${latestTarget}`)
console.log(`Assembled site: ${site}`)
