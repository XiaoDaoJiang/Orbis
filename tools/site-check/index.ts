import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema, type Brief } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { joinBasePath, loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const siteBase = runtimeSiteBase(config)

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

type PublishedBrief = {
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
  'dist/site/archive/index.html',
  'dist/site/slides/index.html',
  'dist/site/briefs/index.html',
  'dist/site/briefs/daily/index.html',
  'dist/site/briefs/weekly/index.html',
  'dist/site/rss.xml',
  'dist/site/favicon.svg',
  'dist/site/archive.json',
  'dist/site/latest/index.html',
]

for (const file of required) {
  await access(resolve(root, file))
  console.log(`✓ ${file}`)
}

const publishedBriefs: PublishedBrief[] = []
const publishedDaily: PublishedBrief[] = []
const publishedWeekly: PublishedBrief[] = []
const publishedPresentations: PublishedBrief[] = []
const dailyDates = new Set<string>()
const briefFiles = await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])

for (const file of briefFiles) {
  const brief = briefSchema.parse(await readYaml(file))
  if (brief.status !== 'published') continue

  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  const published = { brief, slug }
  publishedBriefs.push(published)

  await access(resolve(root, `dist/site/briefs/${slug}/index.html`))
  console.log(`✓ dist/site/briefs/${slug}/index.html`)

  if (brief.presentation.enabled) {
    publishedPresentations.push(published)
    const deckPath = resolve(root, `dist/site/${config.presentation.publicPath}/${slug}/index.html`)
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

    console.log(`✓ ${config.presentation.publicPath}/${slug} (${brief.presentation.template})`)
  }

  if (brief.cadence === 'daily') {
    assert.ok(!dailyDates.has(brief.publishedAt), `Multiple published Daily briefs share date ${brief.publishedAt}`)
    dailyDates.add(brief.publishedAt)
    publishedDaily.push(published)
  } else if (brief.cadence === 'weekly') {
    publishedWeekly.push(published)
  }
}

assert.ok(publishedPresentations.length > 0, 'At least one published presentation is required')
assert.ok(publishedDaily.length > 0, 'At least one published Daily brief is required')

const builtArchive = JSON.parse(await readFile(resolve(root, 'dist/site/archive.json'), 'utf8')) as Archive
const expectedIssues: ArchiveIssue[] = publishedDaily
  .map(({ brief }) => ({
    date: brief.publishedAt,
    title: brief.title,
    path: dailyPath(brief.publishedAt),
    topics: brief.topics,
  }))
  .sort((left, right) => right.date.localeCompare(left.date))

assert.deepEqual(builtArchive.issues, expectedIssues, 'archive.json must be derived only from published structured Daily briefs')
assert.equal(builtArchive.latest, expectedIssues[0].date, 'archive.latest must match the newest published Daily brief')

for (const { brief, slug } of publishedDaily) {
  const expectedPath = dailyPath(brief.publishedAt)
  const aliasPath = resolve(root, 'dist/site', safeRelativePath(expectedPath), 'index.html')
  await access(aliasPath)
  const aliasHtml = await readFile(aliasPath, 'utf8')
  const expectedTarget = brief.presentation.enabled
    ? `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
    : `${joinBasePath(siteBase, 'briefs', slug)}/`
  assert.ok(aliasHtml.includes(expectedTarget), `${expectedPath} must redirect to ${expectedTarget}`)
  console.log(`✓ structured /${expectedPath} -> ${expectedTarget}`)
}

const latestHtml = await readFile(resolve(root, 'dist/site/latest/index.html'), 'utf8')
const latestTarget = `${joinBasePath(siteBase, expectedIssues[0].path)}/`
assert.ok(latestHtml.includes(latestTarget), `/latest/ must redirect to ${latestTarget}`)

const home = await readFile(resolve(root, 'dist/site/index.html'), 'utf8')
const rss = await readFile(resolve(root, 'dist/site/rss.xml'), 'utf8')
const archivePage = await readFile(resolve(root, 'dist/site/archive/index.html'), 'utf8')
const slidesPage = await readFile(resolve(root, 'dist/site/slides/index.html'), 'utf8')
const briefsPage = await readFile(resolve(root, 'dist/site/briefs/index.html'), 'utf8')
const dailyPage = await readFile(resolve(root, 'dist/site/briefs/daily/index.html'), 'utf8')
const weeklyPage = await readFile(resolve(root, 'dist/site/briefs/weekly/index.html'), 'utf8')

assert.match(home, /ORBIS/i)
assert.match(rss, /<rss/)
assert.match(archivePage, /<h1>Archive<\/h1>/i)
assert.match(archivePage, /id="archive-kind"/)
assert.match(archivePage, /id="archive-cadence"/)
assert.match(archivePage, /id="archive-topic"/)
assert.match(slidesPage, /<h1>Presentations<\/h1>/i)
assert.match(dailyPage, /<h1>Daily Briefs<\/h1>/i)
assert.match(weeklyPage, /<h1>Weekly Briefs<\/h1>/i)
assert.ok(briefsPage.includes(`${joinBasePath(siteBase, 'briefs', 'daily')}/`), 'Briefs index must link to the Daily discovery route')
assert.ok(briefsPage.includes(`${joinBasePath(siteBase, 'briefs', 'weekly')}/`), 'Briefs index must link to the Weekly discovery route')

for (const { brief } of publishedBriefs) {
  assert.ok(archivePage.includes(brief.title), `Archive must include published Brief: ${brief.title}`)
  assert.ok(briefsPage.includes(brief.title), `Briefs index must include published Brief: ${brief.title}`)
}

for (const { brief } of publishedDaily) {
  assert.ok(dailyPage.includes(brief.title), `Daily index must include published Daily: ${brief.title}`)
}

for (const { brief, slug } of publishedPresentations) {
  const presentationHref = `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
  assert.ok(slidesPage.includes(brief.title), `Slides index must include published presentation: ${brief.title}`)
  assert.ok(slidesPage.includes(presentationHref), `Slides index must link to ${presentationHref}`)
}

if (publishedWeekly.length === 0) {
  assert.match(weeklyPage, /No weekly briefs have been published yet/i)
} else {
  assert.doesNotMatch(weeklyPage, /No weekly briefs have been published yet/i)
  for (const { brief } of publishedWeekly) {
    assert.ok(weeklyPage.includes(brief.title), `Weekly index must include published Weekly: ${brief.title}`)
  }
}

console.log(`Structured archive checks passed for ${publishedDaily.length} published Daily brief(s); latest=${builtArchive.latest}`)
console.log(`Discovery route checks passed for ${publishedBriefs.length} published Brief(s), ${publishedWeekly.length} Weekly brief(s), and ${publishedPresentations.length} presentation(s)`)
console.log(`Site artifact checks passed for ${publishedPresentations.length} published presentation(s)`)
