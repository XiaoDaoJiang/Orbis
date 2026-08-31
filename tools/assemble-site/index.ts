import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { joinBasePath, loadSiteConfig, normalizeBasePath, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const web = resolve(root, 'dist/web')
const slides = resolve(root, 'dist/slides')
const site = resolve(root, 'dist/site')

type ArchiveIssue = {
  date: string
  title: string
  path: string
  topics?: string[]
  [key: string]: unknown
}

type Archive = {
  latest: string
  issues: ArchiveIssue[]
  [key: string]: unknown
}

function safeRelativePath(value: string): string {
  const normalized = value.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')
  if (!normalized || normalized.split('/').includes('..')) {
    throw new Error(`Unsafe legacy path: ${value}`)
  }
  return normalized
}

function dailyPath(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid Daily date: ${date}`)
  return `${date.replaceAll('-', '/')}/`
}

function redirectHtml(target: string): string {
  const jsTarget = JSON.stringify(target)
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Orbis · Redirect</title><script>const q=location.search||'';location.replace(${jsTarget}+q)</script><noscript><meta http-equiv="refresh" content="0;url=${target}"></noscript></head><body></body></html>`
}

async function rewriteLegacyHtml(directory: string, oldBases: string[], siteBase: string) {
  async function walk(current: string) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name)
      if (entry.isDirectory()) {
        await walk(path)
        continue
      }
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue

      let html = await readFile(path, 'utf8')
      for (const oldBaseValue of oldBases) {
        const oldBase = normalizeBasePath(oldBaseValue)
        if (!oldBase || oldBase === siteBase) continue
        html = html
          .replaceAll(`"${oldBase}/`, `"${siteBase}/`)
          .replaceAll(`'${oldBase}/`, `'${siteBase}/`)
          .replaceAll(`url(${oldBase}/`, `url(${siteBase}/`)
      }
      await writeFile(path, html, 'utf8')
    }
  }

  await walk(directory)
}

await rm(site, { recursive: true, force: true })
await mkdir(site, { recursive: true })
await cp(web, site, { recursive: true })
await cp(slides, resolve(site, 'slides'), { recursive: true })

if (config.compatibility) {
  const siteBase = runtimeSiteBase(config)
  const legacyRoot = resolve(root, config.compatibility.legacyRootDir)
  const archiveSource = resolve(root, config.compatibility.archiveFile)
  const legacyArchive = JSON.parse(await readFile(archiveSource, 'utf8')) as Archive

  if (!legacyArchive.latest || !Array.isArray(legacyArchive.issues) || legacyArchive.issues.length === 0) {
    throw new Error(`Invalid legacy archive: ${config.compatibility.archiveFile}`)
  }

  const legacyDates = new Set<string>()
  for (const issue of legacyArchive.issues) {
    if (!issue.date || !issue.path) throw new Error('Legacy archive issue is missing date/path')
    if (legacyDates.has(issue.date)) throw new Error(`Duplicate legacy archive date: ${issue.date}`)
    legacyDates.add(issue.date)

    const relativePath = safeRelativePath(issue.path)
    const source = resolve(legacyRoot, relativePath)
    const destination = resolve(site, relativePath)
    await rm(destination, { recursive: true, force: true })
    await mkdir(resolve(destination, '..'), { recursive: true })
    await cp(source, destination, { recursive: true })
    await rewriteLegacyHtml(destination, config.compatibility.rewriteBasePaths, siteBase)
    console.log(`Preserved legacy route: /${relativePath}/`)
  }

  const newIssues: ArchiveIssue[] = []
  const structuredDates = new Set<string>()
  const briefFiles = await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])
  for (const file of briefFiles) {
    const brief = briefSchema.parse(await readYaml(file))
    if (brief.status !== 'published' || brief.cadence !== 'daily' || !brief.presentation.enabled) continue

    if (legacyDates.has(brief.publishedAt)) {
      console.log(`Preserved legacy date collision: ${brief.publishedAt}; structured Brief remains on /briefs and /slides routes`)
      continue
    }
    if (structuredDates.has(brief.publishedAt)) {
      throw new Error(`Multiple published Daily briefs share date ${brief.publishedAt}`)
    }
    structuredDates.add(brief.publishedAt)

    const slug = basename(file).replace(/\.(yaml|yml)$/, '')
    const publicPath = dailyPath(brief.publishedAt)
    const destination = resolve(site, safeRelativePath(publicPath))
    const target = `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
    await rm(destination, { recursive: true, force: true })
    await mkdir(destination, { recursive: true })
    await writeFile(resolve(destination, 'index.html'), redirectHtml(target), 'utf8')

    newIssues.push({
      date: brief.publishedAt,
      title: brief.title,
      path: publicPath,
      topics: brief.topics,
    })
    console.log(`Added stable Daily route: /${publicPath} -> ${target}`)
  }

  const issues = [...legacyArchive.issues, ...newIssues]
    .sort((left, right) => right.date.localeCompare(left.date))
  if (issues.length === 0) throw new Error('Merged archive cannot be empty')

  const archive: Archive = {
    ...legacyArchive,
    latest: issues[0].date,
    issues,
  }
  await writeFile(resolve(site, 'archive.json'), `${JSON.stringify(archive, null, 2)}\n`, 'utf8')

  const latestTarget = `${joinBasePath(siteBase, issues[0].path)}/`
  const latestDestination = resolve(site, 'latest')
  await rm(latestDestination, { recursive: true, force: true })
  await mkdir(latestDestination, { recursive: true })
  await writeFile(resolve(latestDestination, 'index.html'), redirectHtml(latestTarget), 'utf8')
  console.log(`Generated latest/archive: ${archive.latest} -> ${latestTarget}`)
}

console.log(`Assembled prototype: ${site}`)
