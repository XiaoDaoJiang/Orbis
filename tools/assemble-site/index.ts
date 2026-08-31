import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadSiteConfig, normalizeBasePath, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const web = resolve(root, 'dist/web')
const slides = resolve(root, 'dist/slides')
const site = resolve(root, 'dist/site')

function safeRelativePath(value: string): string {
  const normalized = value.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')
  if (!normalized || normalized.split('/').includes('..')) {
    throw new Error(`Unsafe legacy path: ${value}`)
  }
  return normalized
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
  const archive = JSON.parse(await readFile(archiveSource, 'utf8')) as {
    latest?: string
    issues?: Array<{ path?: string }>
  }

  if (!archive.latest || !Array.isArray(archive.issues) || archive.issues.length === 0) {
    throw new Error(`Invalid legacy archive: ${config.compatibility.archiveFile}`)
  }

  for (const issue of archive.issues) {
    if (!issue.path) throw new Error('Legacy archive issue is missing path')
    const relativePath = safeRelativePath(issue.path)
    const source = resolve(legacyRoot, relativePath)
    const destination = resolve(site, relativePath)
    await rm(destination, { recursive: true, force: true })
    await mkdir(resolve(destination, '..'), { recursive: true })
    await cp(source, destination, { recursive: true })
    await rewriteLegacyHtml(destination, config.compatibility.rewriteBasePaths, siteBase)
    console.log(`Preserved legacy route: /${relativePath}/`)
  }

  const latestSource = resolve(root, config.compatibility.latestDir)
  const latestDestination = resolve(site, 'latest')
  await rm(latestDestination, { recursive: true, force: true })
  await cp(latestSource, latestDestination, { recursive: true })
  await rewriteLegacyHtml(latestDestination, config.compatibility.rewriteBasePaths, siteBase)

  await cp(archiveSource, resolve(site, 'archive.json'))
  console.log(`Preserved legacy latest/archive at ${siteBase || '/'}`)
}

console.log(`Assembled prototype: ${site}`)
