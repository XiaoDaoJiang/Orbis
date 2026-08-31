import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema, type Brief } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { joinBasePath, loadSiteConfig, normalizeBasePath, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const siteBase = runtimeSiteBase(config)

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

type PublishedDaily = {
  brief: Brief
  slug: string
}

function safeRelativePath(value: string): string {
  const normalized = value.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')
  assert.ok(normalized && !normalized.split('/').includes('..'), `Unsafe archive path: ${value}`)
  return normalized
}

function dailyPath(date: string): string {
  assert.match(date, /^\d{4}-\d{2}-\d{2}$/)
  return `${date.replaceAll('-', '/')}/`
}

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

const publishedDaily: PublishedDaily[] = []
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

  if (brief.cadence === 'daily') publishedDaily.push({ brief, slug })
  console.log(`✓ slides/${slug} (${brief.presentation.template})`)
}

assert.ok(publishedDecks > 0, 'At least one published presentation is required')

if (config.compatibility) {
  const sourceArchive = JSON.parse(await readFile(resolve(root, config.compatibility.archiveFile), 'utf8')) as Archive
  const builtArchive = JSON.parse(await readFile(resolve(root, 'dist/site/archive.json'), 'utf8')) as Archive
  assert.ok(sourceArchive.latest, 'Legacy archive must declare latest')
  assert.ok(Array.isArray(sourceArchive.issues) && sourceArchive.issues.length > 0, 'Legacy archive must contain issues')
  assert.ok(Array.isArray(builtArchive.issues) && builtArchive.issues.length > 0, 'Built archive must contain issues')

  const legacyByDate = new Map<string, ArchiveIssue>()
  const legacyHtmlFiles: string[] = []
  for (const issue of sourceArchive.issues) {
    assert.ok(issue.date && issue.path, 'Legacy archive issue must declare date/path')
    assert.ok(!legacyByDate.has(issue.date), `Duplicate legacy archive date: ${issue.date}`)
    legacyByDate.set(issue.date, issue)

    const builtIssue = builtArchive.issues.find((candidate) => candidate.date === issue.date)
    assert.ok(builtIssue, `Built archive must preserve legacy issue ${issue.date}`)
    assert.deepEqual(builtIssue, issue, `Legacy archive issue ${issue.date} must remain semantically unchanged`)

    const relativePath = safeRelativePath(issue.path)
    const directory = resolve(root, 'dist/site', relativePath)
    const indexPath = resolve(directory, 'index.html')
    await access(indexPath)
    legacyHtmlFiles.push(indexPath)

    const html = await readFile(indexPath, 'utf8')
    const payloads = [...html.matchAll(/["'](payload-[^"']+\.txt)["']/g)].map((match) => match[1])
    for (const payload of payloads) await access(resolve(directory, payload))
    console.log(`✓ legacy /${relativePath}/ (${payloads.length} payload asset(s))`)
  }

  for (const { brief, slug } of publishedDaily) {
    const legacyIssue = legacyByDate.get(brief.publishedAt)
    if (legacyIssue) {
      const builtIssue = builtArchive.issues.find((candidate) => candidate.date === brief.publishedAt)
      assert.deepEqual(builtIssue, legacyIssue, `Date collision ${brief.publishedAt} must preserve the historical issue`)
      console.log(`✓ collision ${brief.publishedAt} preserves legacy history; structured Brief stays on /briefs and /slides`)
      continue
    }

    const expectedPath = dailyPath(brief.publishedAt)
    const builtIssue = builtArchive.issues.find((candidate) => candidate.date === brief.publishedAt)
    assert.ok(builtIssue, `Built archive must include published Daily ${brief.publishedAt}`)
    assert.deepEqual(
      builtIssue,
      { date: brief.publishedAt, title: brief.title, path: expectedPath, topics: brief.topics },
      `Built archive metadata must match published Daily ${brief.publishedAt}`,
    )

    const aliasPath = resolve(root, 'dist/site', safeRelativePath(expectedPath), 'index.html')
    await access(aliasPath)
    const aliasHtml = await readFile(aliasPath, 'utf8')
    const expectedDeckTarget = `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
    assert.ok(aliasHtml.includes(expectedDeckTarget), `${expectedPath} must redirect to ${expectedDeckTarget}`)
    console.log(`✓ stable /${expectedPath} -> ${expectedDeckTarget}`)
  }

  const sortedDates = builtArchive.issues.map((issue) => issue.date)
  assert.deepEqual(sortedDates, [...sortedDates].sort((left, right) => right.localeCompare(left)), 'Built archive issues must be newest-first')
  assert.equal(builtArchive.latest, builtArchive.issues[0].date, 'archive.latest must match the newest merged issue')

  for (const issue of builtArchive.issues) {
    await access(resolve(root, 'dist/site', safeRelativePath(issue.path), 'index.html'))
  }

  const latestPath = resolve(root, 'dist/site/latest/index.html')
  await access(latestPath)
  const latestHtml = await readFile(latestPath, 'utf8')
  const latestTarget = `${joinBasePath(siteBase, builtArchive.issues[0].path)}/`
  assert.ok(latestHtml.includes(latestTarget), `/latest/ must redirect to ${latestTarget}`)

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

  console.log(`Merged archive checks passed: ${sourceArchive.issues.length} legacy + ${builtArchive.issues.length - sourceArchive.issues.length} structured issue(s); latest=${builtArchive.latest}`)
}

const home = await readFile(resolve(root, 'dist/site/index.html'), 'utf8')
const rss = await readFile(resolve(root, 'dist/site/rss.xml'), 'utf8')
assert.match(home, /ORBIS/i)
assert.match(rss, /<rss/)
console.log(`Prototype artifact checks passed for ${publishedDecks} published presentation(s)`)
