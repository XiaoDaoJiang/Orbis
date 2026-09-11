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
    .filter((candidate) => candidate.publishedAt < current.publishedAt)
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
  assert.ok(start >= 0, `Missing article start for marker: ${marker}`)
  const end = html.indexOf('</article>', markerIndex)
  assert.ok(end >= 0, `Missing article end for marker: ${marker}`)
  return html.slice(start, end + '</article>'.length)
}

const briefFiles = await listFiles(resolve(root, 'content/briefs'), ['.yaml', '.yml'])
const publishedBriefs: PublishedBrief[] = []
for (const file of briefFiles) {
  const brief = briefSchema.parse(await readYaml<unknown>(file))
  if (brief.status === 'published') {
    publishedBriefs.push({ brief, slug: basename(file).replace(/\.ya?ml$/, '') })
  }
}

const essayFiles = await listFiles(resolve(root, 'content/essays'), ['.md', '.mdx'])
const publishedEssays: { essay: Essay; slug: string }[] = []
for (const file of essayFiles) {
  const { data } = await readMarkdownFrontmatter(file)
  const essay = essaySchema.parse(data)
  if (essay.status === 'published') {
    publishedEssays.push({ essay, slug: basename(file).replace(/\.mdx?$/, '') })
  }
}

const knowledgeFiles = await listFiles(resolve(root, 'content/knowledge'), ['.md', '.mdx'])
const publicKnowledge: { knowledge: Knowledge; slug: string }[] = []
for (const file of knowledgeFiles) {
  const { data } = await readMarkdownFrontmatter(file)
  const knowledge = knowledgeSchema.parse(data)
  if (knowledge.status === 'published' || knowledge.status === 'active') {
    publicKnowledge.push({ knowledge, slug: basename(file).replace(/\.mdx?$/, '') })
  }
}

const topicFiles = await listFiles(resolve(root, 'content/topics'), ['.yaml', '.yml'])
const publicTopics: PublicTopic[] = []
for (const file of topicFiles) {
  const topic = topicSchema.parse(await readYaml<unknown>(file))
  if (topic.status !== 'archived') {
    publicTopics.push({ id: basename(file).replace(/\.ya?ml$/, ''), name: topic.name })
  }
}

const standalonePresentationFiles = await listFiles(resolve(root, 'content/presentations'), ['.yaml', '.yml'])
const publishedStandalonePresentations: PublishedStandalonePresentation[] = []
for (const file of standalonePresentationFiles) {
  const presentation = presentationContentSchema.parse(await readYaml<unknown>(file))
  if (presentation.status === 'published') {
    publishedStandalonePresentations.push({
      presentation,
      slug: basename(file).replace(/\.ya?ml$/, ''),
    })
  }
}

const publishedDaily = publishedBriefs.filter(({ brief }) => brief.cadence === 'daily')
const publishedWeekly = publishedBriefs.filter(({ brief }) => brief.cadence === 'weekly')
const expectedIssues = sortPublicNewest(publishedDaily.map(({ brief, slug }) => ({
  id: slug,
  date: brief.publishedAt,
  title: brief.title,
  path: dailyPath(brief.publishedAt),
  topics: brief.topics,
}))).map(({ id: _id, ...issue }) => issue)

const publicDiscovery: PublicDiscovery[] = [
  ...publishedBriefs.map(({ brief, slug }) => ({
    kind: 'brief' as const,
    id: slug,
    title: brief.title,
    publishedAt: brief.publishedAt,
    topics: brief.topics,
    pagePath: `dist/site/briefs/${slug}/index.html`,
  })),
  ...publishedEssays.map(({ essay, slug }) => ({
    kind: 'essay' as const,
    id: slug,
    title: essay.title,
    publishedAt: essay.publishedAt,
    updatedAt: essay.updatedAt,
    topics: essay.topics,
    pagePath: `dist/site/essays/${slug}/index.html`,
  })),
  ...publicKnowledge.map(({ knowledge, slug }) => ({
    kind: 'knowledge' as const,
    id: slug,
    title: knowledge.title,
    publishedAt: knowledge.publishedAt,
    updatedAt: knowledge.updatedAt,
    topics: knowledge.topics,
    pagePath: `dist/site/knowledge/${slug}/index.html`,
  })),
]

const publicPresentations: PublicPresentation[] = [
  ...publishedBriefs
    .filter(({ brief }) => brief.presentation.enabled)
    .map(({ brief, slug }) => ({
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

const builtArchive = JSON.parse(await readFile(resolve(root, 'dist/site/archive.json'), 'utf8')) as Archive
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
  for (const future of publicDiscovery.filter((candidate) => candidate.publishedAt >= current.publishedAt)) {
    if (relatedIdentity(future) === relatedIdentity(current)) continue
    assert.ok(
      !html.includes(`data-related-id="${relatedIdentity(future)}"`),
      `${relatedIdentity(current)} must not relate forward to ${relatedIdentity(future)}`,
    )
  }
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

for (const { slug } of publishedBriefs) {
  assert.ok(briefsPage.includes(`${joinBasePath(siteBase, 'briefs', slug)}/`), `Brief discovery must include ${slug}`)
}
for (const { slug } of publishedDaily) {
  assert.ok(dailyPage.includes(`${joinBasePath(siteBase, 'briefs', slug)}/`), `Daily discovery must include ${slug}`)
}
for (const { slug } of publishedWeekly) {
  assert.ok(weeklyPage.includes(`${joinBasePath(siteBase, 'briefs', slug)}/`), `Weekly discovery must include ${slug}`)
}

for (const issue of expectedIssues) {
  const brief = publishedDaily.find(({ brief }) => brief.publishedAt === issue.date)?.brief
  assert.ok(brief, `Missing Daily Brief for archive issue ${issue.date}`)
  const slug = publishedDaily.find(({ brief }) => brief.publishedAt === issue.date)?.slug
  assert.ok(slug, `Missing Daily Brief slug for archive issue ${issue.date}`)
  assert.ok(archivePage.includes(`${joinBasePath(siteBase, 'briefs', slug)}/`), `Archive page must include Daily ${issue.date}`)
  assert.ok(rss.includes(issue.title), `RSS must include Daily ${issue.date}`)
}

for (const presentation of publicPresentations) {
  const presentationHref = `${joinBasePath(siteBase, config.presentation.publicPath, presentation.id)}/`
  assert.ok(slidesPage.includes(presentationHref), `Slides discovery must include ${presentation.id}`)
}

for (const topic of publicTopics) {
  const topicPage = await readFile(resolve(root, `dist/site/topics/${topic.id}/index.html`), 'utf8')
  assert.match(topicPage, new RegExp(topic.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}

console.log(`Structured archive checks passed for ${publishedDaily.length} published Daily brief(s); latest=${expectedIssues[0].date}`)
console.log(`Relation checks passed for ${publicDiscovery.length} public content item(s) and ${publishedDaily.length} Daily brief(s)`)
console.log(`Homepage discovery checks passed for latest Brief=${sortPublicNewest(publicDiscovery.filter((item) => item.kind === 'brief'))[0]?.id}, Essay=${sortPublicNewest(publicDiscovery.filter((item) => item.kind === 'essay'))[0]?.id}, Presentation=${sortPublicNewest(publicPresentations.map((item) => ({ ...item, id: item.id })))[0]?.id}`)
console.log(`Discovery route checks passed for ${publishedBriefs.length} published Brief(s), ${publishedWeekly.length} Weekly brief(s), and ${publicPresentations.length} presentation(s)`)
console.log(`Site artifact checks passed for ${publishedBriefs.filter(({ brief }) => brief.presentation.enabled).length} Brief presentation(s) + ${publishedStandalonePresentations.length} standalone Presentation(s)`)
