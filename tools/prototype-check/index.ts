import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { loadSiteConfig, normalizeBasePath, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const siteBase = runtimeSiteBase(config)

const required = [
  'dist/site/index.html',
  'dist/site/essays/agent-harness-system-layer/index.html',
  'dist/site/topics/agent-harness/index.html',
  'dist/site/knowledge/verification-loop/index.html',
  'dist/site/rss.xml',
  'dist/site/favicon.svg',
]

for (const file of required) {
  await access(resolve(root, file))
  console.log(`✓ ${file}`)
}

const briefFiles = await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])
let publishedDecks = 0
for (const file of briefFiles) {
  const brief = briefSchema.parse(await readYaml(file))
  if (brief.status !== 'published') continue

  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  await access(resolve(root, `dist/site/briefs/${slug}/index.html`))
  console.log(`✓ dist/site/briefs/${slug}/index.html`)

  if (!brief.presentation.enabled) continue
  publishedDecks += 1
  const deckPath = resolve(root, `dist/site/slides/${slug}/index.html`)
  const sourcePath = resolve(root, `${config.presentation.generatedDir}/${slug}/slides.md`)
  await access(deckPath)
  await access(sourcePath)

  const deck = await readFile(deckPath, 'utf8')
  const slideSource = await readFile(sourcePath, 'utf8')
  assert.match(deck, /<html/i)
  assert.doesNotMatch(deck, /cdn\.jsdelivr\.net\/gh\/slidevjs\/slidev\/assets\/favicon\.png/)
  assert.match(slideSource, new RegExp(`favicon: ["']?${siteBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/favicon\\.svg`))

  if (brief.presentation.template === 'daily-v1') {
    const frontmatterMarkers = slideSource.match(/^---$/gm) ?? []
    assert.equal(frontmatterMarkers.length, 22, `${slug} daily-v1 must contain exactly 11 slides`)
    assert.match(slideSource, /FOUR SIGNALS/)
    assert.match(slideSource, /FROM SIGNALS TO ACTION/)
    assert.match(slideSource, /EXTENDED READING/)
  }
  console.log(`✓ slides/${slug} (${brief.presentation.template})`)
}

assert.ok(publishedDecks > 0, 'At least one published presentation is required')

if (config.compatibility) {
  const sourceArchive = JSON.parse(await readFile(resolve(root, config.compatibility.archiveFile), 'utf8')) as {
    latest?: string
    issues?: Array<{ date?: string; path?: string }>
  }
  const builtArchive = JSON.parse(await readFile(resolve(root, 'dist/site/archive.json'), 'utf8'))
  assert.deepEqual(builtArchive, sourceArchive, 'Legacy archive.json must be preserved without semantic changes during cutover')
  assert.ok(sourceArchive.latest, 'Legacy archive must declare latest')
  assert.ok(sourceArchive.issues?.some((issue) => issue.date === sourceArchive.latest), 'Legacy latest must reference an archived issue')

  const latestPath = resolve(root, 'dist/site/latest/index.html')
  await access(latestPath)
  const legacyHtmlFiles = [latestPath]

  for (const issue of sourceArchive.issues ?? []) {
    assert.ok(issue.path, 'Legacy archive issue must declare path')
    const relativePath = issue.path.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')
    assert.ok(relativePath && !relativePath.split('/').includes('..'), `Unsafe legacy issue path: ${issue.path}`)
    const directory = resolve(root, 'dist/site', relativePath)
    const indexPath = resolve(directory, 'index.html')
    await access(indexPath)
    legacyHtmlFiles.push(indexPath)

    const html = await readFile(indexPath, 'utf8')
    const payloads = [...html.matchAll(/["'](payload-[^"']+\.txt)["']/g)].map((match) => match[1])
    for (const payload of payloads) await access(resolve(directory, payload))
    console.log(`✓ legacy /${relativePath}/ (${payloads.length} payload asset(s))`)
  }

  for (const htmlPath of legacyHtmlFiles) {
    const html = await readFile(htmlPath, 'utf8')
    for (const oldBaseValue of config.compatibility.rewriteBasePaths) {
      const oldBase = normalizeBasePath(oldBaseValue)
      if (!oldBase || oldBase === siteBase) continue
      assert.ok(
        !html.includes(`"${oldBase}/`) && !html.includes(`'${oldBase}/`) && !html.includes(`url(${oldBase}/`),
        `${htmlPath} still contains legacy absolute asset base ${oldBase}`,
      )
    }
  }
  console.log(`Legacy compatibility checks passed for ${sourceArchive.issues?.length ?? 0} archived issue(s)`)
}

const home = await readFile(resolve(root, 'dist/site/index.html'), 'utf8')
const rss = await readFile(resolve(root, 'dist/site/rss.xml'), 'utf8')
assert.match(home, /ORBIS/i)
assert.match(rss, /<rss/)
console.log(`Prototype artifact checks passed for ${publishedDecks} published presentation(s)`)
