import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import {
  briefSchema,
  essaySchema,
  knowledgeSchema,
  presentationContentSchema,
  topicSchema,
  type Brief,
  type Essay,
  type Knowledge,
  type PresentationContent,
} from '@orbis/content-schema'
import { listFiles, readMarkdownFrontmatter, readYaml } from '../shared/content.ts'
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

type PublishedStandalonePresentation = {
  presentation: PresentationContent
  slug: string
}

type PublicPresentation = {
  id: string
  title: string
  publishedAt: string
  sourceKind: 'brief' | 'presentation'
}

type PublicDiscovery = {
  kind: 'brief' | 'essay' | 'knowledge'
  id: string
  title: string
  publishedAt: string
  updatedAt?: string
  topics: string[]
  pagePath: string
}

type PublicTopic = {
  id: string
  name: string
}

async function assertMissing(path: string, message: string) {
  try {
    await access(path)
    assert.fail(message)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
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

function relatedIdentity(item: Pick<PublicDiscovery, 'kind' | 'id'>): string {
  return `${item.kind}:${item.id}`
}

function sharedTopicCount(left: PublicDiscovery, right: PublicDiscovery): number {
  const topics = new Set(left.topics)
  return right.topics.filter((topic) => topics.has(topic)).length
}

function expectedRelated(current: PublicDiscovery, candidates: PublicDiscovery[], limit = 3): PublicDiscovery[] {
  return candidates
    .filter((candidate) => relatedIdentity(candidate) !== relatedIdentity(current))
    .map((candidate) => ({ candidate, shared: sharedTopicCount(current, candidate) }))
    .filter(({ shared }) => shared > 0)
    .sort((left, right) =>
      right.shared - left.shared
      || right.candidate.publishedAt.localeCompare(left.candidate.publishedAt)
      || left.candidate.title.localeCompare(right.candidate.title)
      || left.candidate.kind.localeCompare(right.candidate.kind)
      || left.candidate.id.localeCompare(right.candidate.id))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}

function sortPublicNewest<T extends { publishedAt: string; title: string; id: string }>(items: T[]): T[] {
  return [...items].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt)
    || left.title.localeCompare(right.title)
    || left.id.localeCompare(right.id))
}

function articleFragment(html: string, marker: string): string {
  const markerIndex = html.indexOf(marker)
  assert.ok(markerIndex >= 0, `Missing HTML marker: ${marker}`)
  const start = html.lastIndexOf('<article', markerIndex)
  const end = html.indexOf('</article>', markerIndex)
  assert.ok(start >= 0 && end >= 0, `Marker is not inside an article: ${marker}`)
  return html.slice(start, end + '</article>'.length)
}

async function loadPublicMarkdownEntries<T extends Essay | Knowledge>(
  directory: string,
  kind: 'essay' | 'knowledge',
  parse: (value: unknown) => T,
  isPublic: (entry: T) => boolean,
): Promise<PublicDiscovery[]> {
  const files = await listFiles(resolve(root, directory), ['.md', '.mdx'])
  const entries: PublicDiscovery[] = []
  for (const file of files) {
    const { data } = await readMarkdownFrontmatter(file)
    const entry = parse(data)
    if (!isPublic(entry)) continue
    const id = basename(file).replace(/\.(md|mdx)$/, '')
    entries.push({
      kind,
      id,
      title: entry.title,
      publishedAt: entry.publishedAt,
      updatedAt: entry.updatedAt,
      topics: entry.topics,
      pagePath: `dist/site/${kind === 'essay' ? 'essays' : 'knowledge'}/${id}/index.html`,
    })
  }
  return entries
}

async function loadPublicTopics(): Promise<PublicTopic[]> {
  const files = await listFiles(resolve(root, 'content/topics'), ['.yaml', '.yml'])
  const topics: PublicTopic[] = []
  for (const file of files) {
    const topic = topicSchema.parse(await readYaml(file))
    if (topic.status === 'archived') continue
    const id = basename(file).replace(/\.(yaml|yml)$/, '')
    topics.push({ id, name: topic.name })
  }
  return topics.sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
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
const publishedBriefPresentations: PublishedBrief[] = []
const publishedStandalonePresentations: PublishedStandalonePresentation[] = []
const nonPublicStandaloneTitles: string[] = []
const publicDiscovery: PublicDiscovery[] = []
const dailyDates = new Set<string>()
const briefFiles = await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])

for (const file of briefFiles) {
  const brief = briefSchema.parse(await readYaml(file))
  if (brief.status !== 'published') continue

  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  const published = { brief, slug }
  publishedBriefs.push(published)
  publicDiscovery.push({
    kind: 'brief',
    id: slug,
    title: brief.title,
    publishedAt: brief.publishedAt,
    topics: brief.topics,
    pagePath: `dist/site/briefs/${slug}/index.html`,
  })

  const briefPath = resolve(root, `dist/site/briefs/${slug}/index.html`)
  await access(briefPath)
  const briefHtml = await readFile(briefPath, 'utf8')
  console.log(`✓ dist/site/briefs/${slug}/index.html`)

  const presentationHref = `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
  if (brief.presentation.enabled) {
    publishedBriefPresentations.push(published)
    assert.ok(briefHtml.includes(presentationHref), `${slug} reading page must link to ${presentationHref}`)

    const deckPath = resolve(root, `dist/site/${config.presentation.publicPath}/${slug}/index.html`)
    const sourcePath = resolve(root, `${config.presentation.generatedDir}/${slug}/slides.md`)
    await access(deckPath)
    await access(sourcePath)

    const deck = await readFile(deckPath, 'utf8')
    const slideSource = await readFile(sourcePath, 'utf8')
    assert.match(deck, /<html/i)
    assert.doesNotMatch(deck, /cdn\.jsdelivr\.net\/gh\/slidevjs\/slidev\/assets\/favicon\.png/)
    assert.match(slideSource, new RegExp(`favicon: ["']?${siteBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/favicon\\.svg`))

    const readingHref = `${joinBasePath(siteBase, 'briefs', slug)}/`
    assert.ok(slideSource.includes(readingHref), `${slug} presentation source must link back to ${readingHref}`)

    if (brief.presentation.template === 'daily-v1') {
      const frontmatterMarkers = slideSource.match(/^---$/gm) ?? []
      assert.equal(frontmatterMarkers.length, 22, `${slug} daily-v1 must contain exactly 11 slides`)
      assert.match(slideSource, /FOUR SIGNALS/)
      assert.match(slideSource, /FROM SIGNALS TO ACTION/)
      assert.match(slideSource, /EXTENDED READING/)
    }

    console.log(`✓ ${config.presentation.publicPath}/${slug} (${brief.presentation.template}, brief)`)
  } else {
    assert.ok(!briefHtml.includes(presentationHref), `${slug} reading page must not claim disabled presentation ${presentationHref}`)
  }

  if (brief.cadence === 'daily') {
    assert.ok(!dailyDates.has(brief.publishedAt), `Multiple published Daily briefs share date ${brief.publishedAt}`)
    dailyDates.add(brief.publishedAt)
    publishedDaily.push(published)
  } else if (brief.cadence === 'weekly') {
    publishedWeekly.push(published)
  }
}

const standaloneFiles = await listFiles(resolve(root, config.content.presentationsDir), ['.yaml', '.yml'])
for (const file of standaloneFiles) {
  const presentation = presentationContentSchema.parse(await readYaml(file))
  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  const deckPath = resolve(root, `dist/site/${config.presentation.publicPath}/${slug}/index.html`)
  const sourcePath = resolve(root, `${config.presentation.generatedDir}/${slug}/slides.md`)

  if (presentation.status !== 'published') {
    nonPublicStandaloneTitles.push(presentation.title)
    await assertMissing(deckPath, `${slug} non-public standalone Presentation must not have a public deck`)
    await assertMissing(sourcePath, `${slug} non-public standalone Presentation must not generate Slidev source`)
    continue
  }

  publishedStandalonePresentations.push({ presentation, slug })
  await access(deckPath)
  await access(sourcePath)
  const deck = await readFile(deckPath, 'utf8')
  const slideSource = await readFile(sourcePath, 'utf8')
  assert.match(deck, /<html/i)
  assert.doesNotMatch(deck, /cdn\.jsdelivr\.net\/gh\/slidevjs\/slidev\/assets\/favicon\.png/)
  assert.match(slideSource, new RegExp(`favicon: ["']?${siteBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/favicon\\.svg`))
  assert.ok(slideSource.includes(presentation.title), `${slug} talk source must contain its title`)
  assert.match(slideSource, /REFERENCES/)

  if (presentation.template === 'talk-v1') {
    const frontmatterMarkers = slideSource.match(/^---$/gm) ?? []
    const expectedMarkers = (presentation.sections.length + 2) * 2
    assert.equal(frontmatterMarkers.length, expectedMarkers, `${slug} talk-v1 must contain sections.length + 2 slides`)
  }

  console.log(`✓ ${config.presentation.publicPath}/${slug} (${presentation.template}, presentation)`)
}

publicDiscovery.push(...await loadPublicMarkdownEntries(
  'content/essays',
  'essay',
  (value) => essaySchema.parse(value),
  (entry) => entry.status === 'published',
))
publicDiscovery.push(...await loadPublicMarkdownEntries(
  'content/knowledge',
  'knowledge',
  (value) => knowledgeSchema.parse(value),
  (entry) => entry.status === 'published' || entry.status === 'active',
))
const publicTopics = await loadPublicTopics()
const presentationCount = publishedBriefPresentations.length + publishedStandalonePresentations.length

assert.ok(presentationCount > 0, 'At least one published presentation is required')
assert.ok(publishedStandalonePresentations.length > 0, 'At least one published standalone Presentation is required')
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

const dailySequence = [...publishedDaily].sort((left, right) =>
  left.brief.publishedAt.localeCompare(right.brief.publishedAt)
  || left.brief.title.localeCompare(right.brief.title)
  || left.slug.localeCompare(right.slug))
for (const [index, { slug }] of dailySequence.entries()) {
  const html = await readFile(resolve(root, `dist/site/briefs/${slug}/index.html`), 'utf8')
  const previous = dailySequence[index - 1]
  const next = dailySequence[index + 1]
  if (previous) {
    const previousHref = `${joinBasePath(siteBase, 'briefs', previous.slug)}/`
    assert.match(html, new RegExp(`data-adjacent=["']previous["'][^>]*href=["']${previousHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']|href=["']${previousHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*data-adjacent=["']previous["']`))
  } else {
    assert.doesNotMatch(html, /data-adjacent=["']previous["']/)
  }
  if (next) {
    const nextHref = `${joinBasePath(siteBase, 'briefs', next.slug)}/`
    assert.match(html, new RegExp(`data-adjacent=["']next["'][^>]*href=["']${nextHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']|href=["']${nextHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*data-adjacent=["']next["']`))
  } else {
    assert.doesNotMatch(html, /data-adjacent=["']next["']/)
  }
}

for (const current of publicDiscovery) {
  const html = await readFile(resolve(root, current.pagePath), 'utf8')
  const related = expectedRelated(current, publicDiscovery)
  const selfMarker = `data-related-id="${relatedIdentity(current)}"`
  assert.ok(!html.includes(selfMarker), `${relatedIdentity(current)} must not list itself as Related Content`)
  if (related.length === 0) {
    assert.doesNotMatch(html, /<h2[^>]*>Related Content<\/h2>/i)
    continue
  }
  assert.match(html, /<h2[^>]*>Related Content<\/h2>/i)
  for (const expected of related) {
    assert.ok(html.includes(`data-related-id="${relatedIdentity(expected)}"`), `${relatedIdentity(current)} must relate to ${relatedIdentity(expected)}`)
  }
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
assert.match(home, /data-home-section=["']latest-brief["']/)
assert.match(home, /data-home-section=["']latest-essay["']/)
assert.match(home, /data-home-section=["']latest-presentation["']/)
assert.match(home, /data-home-section=["']knowledge-updates["']/)
assert.match(home, /data-home-section=["']active-topics["']/)
assert.match(home, /data-home-section=["']explore["']/)

const latestBrief = sortPublicNewest(publishedBriefs.map(({ brief, slug }) => ({
  id: slug,
  title: brief.title,
  publishedAt: brief.publishedAt,
})))[0]
assert.ok(latestBrief, 'Homepage requires at least one public Brief')
assert.ok(home.includes(`data-home-id="brief:${latestBrief.id}"`), `Homepage Latest Brief must be ${latestBrief.id}`)
assert.ok(home.includes(`${joinBasePath(siteBase, 'briefs', latestBrief.id)}/`), 'Homepage Latest Brief must link to Reading')

const publicEssays = publicDiscovery.filter((entry) => entry.kind === 'essay')
const latestEssay = sortPublicNewest(publicEssays)[0]
assert.ok(latestEssay, 'Homepage requires at least one public Essay')
assert.ok(home.includes(`data-home-id="essay:${latestEssay.id}"`), `Homepage Latest Essay must be ${latestEssay.id}`)

const publicPresentations: PublicPresentation[] = [
  ...publishedBriefPresentations.map(({ brief, slug }) => ({
    id: slug,
    title: brief.title,
    publishedAt: brief.publishedAt,
    sourceKind: 'brief' as const,
  })),
  ...publishedStandalonePresentations.map(({ presentation, slug }) => ({
    id: slug,
    title: presentation.title,
    publishedAt: presentation.publishedAt,
    sourceKind: 'presentation' as const,
  })),
]
const latestPresentation = sortPublicNewest(publicPresentations)[0]
assert.ok(latestPresentation, 'Homepage requires at least one public Presentation')
assert.ok(home.includes(`data-home-id="presentation:${latestPresentation.id}"`), `Homepage Latest Presentation must be ${latestPresentation.id}`)
assert.ok(home.includes(`${joinBasePath(siteBase, config.presentation.publicPath, latestPresentation.id)}/`), 'Homepage Latest Presentation must link to Slides')
const latestPresentationCard = articleFragment(home, `data-home-id="presentation:${latestPresentation.id}"`)
assert.ok(latestPresentationCard.includes(`data-presentation-source="${latestPresentation.sourceKind}"`), 'Homepage Latest Presentation must expose its source kind')
if (latestPresentation.sourceKind === 'presentation') {
  assert.ok(!latestPresentationCard.includes('Reading →'), 'Standalone Homepage Presentation must not expose a fake Reading link')
}

const knowledgeUpdates = publicDiscovery
  .filter((entry) => entry.kind === 'knowledge')
  .sort((left, right) =>
    (right.updatedAt ?? right.publishedAt).localeCompare(left.updatedAt ?? left.publishedAt)
    || left.title.localeCompare(right.title)
    || left.id.localeCompare(right.id))
  .slice(0, 3)
for (const item of knowledgeUpdates) {
  assert.ok(home.includes(`data-home-id="knowledge:${item.id}"`), `Homepage Knowledge Updates must include ${item.id}`)
}

for (const topic of publicTopics) {
  assert.ok(home.includes(`data-home-topic="${topic.id}"`), `Homepage Active Topics must include ${topic.id}`)
  assert.ok(home.includes(`${joinBasePath(siteBase, 'topics', topic.id)}/`), `Homepage Active Topics must link to ${topic.id}`)
}

for (const path of ['archive', 'slides', 'briefs/daily', 'briefs/weekly', 'essays', 'knowledge']) {
  assert.ok(home.includes(`${joinBasePath(siteBase, path)}/`), `Homepage Explore must link to /${path}/`)
}
assert.ok(home.includes(`${joinBasePath(siteBase, 'rss.xml')}`), 'Homepage Explore must link to RSS')

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

for (const { brief, slug } of publishedBriefPresentations) {
  const presentationHref = `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
  assert.ok(slidesPage.includes(brief.title), `Slides index must include published Brief presentation: ${brief.title}`)
  assert.ok(slidesPage.includes(presentationHref), `Slides index must link to ${presentationHref}`)
}

for (const { presentation, slug } of publishedStandalonePresentations) {
  const presentationHref = `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
  assert.ok(slidesPage.includes(presentation.title), `Slides index must include standalone Presentation: ${presentation.title}`)
  assert.ok(slidesPage.includes(presentationHref), `Slides index must link to ${presentationHref}`)
  const card = articleFragment(slidesPage, `data-presentation-id="${slug}"`)
  assert.ok(card.includes('data-presentation-source="presentation"'), `${slug} Slides card must expose standalone source kind`)
  assert.ok(!card.includes('Read brief'), `${slug} standalone Slides card must not expose a fake Brief reading link`)
}

for (const title of nonPublicStandaloneTitles) {
  assert.ok(!slidesPage.includes(title), `Slides index must exclude non-public standalone Presentation: ${title}`)
  assert.ok(!home.includes(title), `Homepage must exclude non-public standalone Presentation: ${title}`)
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
console.log(`Relation checks passed for ${publicDiscovery.length} public content item(s) and ${publishedDaily.length} Daily brief(s)`)
console.log(`Homepage discovery checks passed for latest Brief=${latestBrief.id}, Essay=${latestEssay.id}, Presentation=${latestPresentation.id}`)
console.log(`Discovery route checks passed for ${publishedBriefs.length} published Brief(s), ${publishedWeekly.length} Weekly brief(s), and ${presentationCount} presentation(s)`)
console.log(`Site artifact checks passed for ${publishedBriefPresentations.length} Brief presentation(s) + ${publishedStandalonePresentations.length} standalone Presentation(s)`)
