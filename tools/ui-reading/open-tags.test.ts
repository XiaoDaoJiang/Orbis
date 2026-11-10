import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { archiveSearchText, emptyArchiveFilters, matchesArchiveFilters, readArchiveFilters, writeArchiveFilters } from '../../apps/web/src/lib/archive-filters.ts'
import { getRelatedContent, toBriefDiscoveryItem, toEssayDiscoveryItem, toKnowledgeDiscoveryItem, type DiscoveryItem } from '../../apps/web/src/lib/content-discovery.ts'

const current: DiscoveryItem = { id: 'current', kind: 'brief', title: 'Daily', summary: 'Summary', publishedAt: '2026-11-09', topics: ['coding-agent'], tags: ['agent-security', 'ＡＩ', '中文标签'], href: '/briefs/current/' }
const candidate = { kind: 'brief', cadence: 'daily', topics: current.topics, text: archiveSearchText(current) }
for (const query of ['AGENT-SECURITY', 'ai', '中文标签', 'ａｇｅｎｔ－ｓｅｃｕｒｉｔｙ']) {
  assert.ok(matchesArchiveFilters(candidate, { ...emptyArchiveFilters, query }), query)
  const filters = { ...emptyArchiveFilters, query }
  assert.deepEqual(readArchiveFilters(writeArchiveFilters(new URLSearchParams('utm_source=test'), filters), ['all', 'coding-agent']), filters)
}
assert.equal(matchesArchiveFilters(candidate, { ...emptyArchiveFilters, topic: 'agent-security' }), false)
assert.equal(readArchiveFilters(new URLSearchParams('topic=agent-security'), ['all', 'coding-agent']).topic, 'all')
assert.equal(archiveSearchText({ ...current, tags: undefined }), 'Daily Summary coding-agent')
const tagOnly = { ...current, id: 'tag-only', topics: [], publishedAt: '2026-11-10' }
const topicOnly = { ...current, id: 'topic-only', tags: [] }
assert.deepEqual(getRelatedContent(current, [tagOnly, topicOnly]).map((item) => item.id), ['topic-only'])
assert.deepEqual(getRelatedContent(tagOnly, [current]), [])
// Optional/unknown metadata on other content types must not become discovery tags.
const baseData = { title: 'Test', summary: 'Summary', description: 'Description', publishedAt: '2026-11-09', topics: ['coding-agent'], tags: ['untrusted-extra'], presentation: { enabled: false } }
assert.deepEqual(toBriefDiscoveryItem({ id: 'legacy', data: { ...baseData, cadence: 'daily' } } as any, '').tags, [])
assert.deepEqual(toBriefDiscoveryItem({ id: 'weekly', data: { ...baseData, cadence: 'weekly' } } as any, '').tags, [])
assert.deepEqual(toBriefDiscoveryItem({ id: 'evidence', data: { ...baseData, cadence: 'daily', evidenceVersion: 1 } } as any, '').tags, ['untrusted-extra'])
assert.equal(toEssayDiscoveryItem({ id: 'essay', data: baseData } as any, '').tags, undefined)
assert.equal(toKnowledgeDiscoveryItem({ id: 'knowledge', data: baseData } as any, '').tags, undefined)
const root = resolve(import.meta.dirname, '../..')
const component = await readFile(resolve(root, 'apps/web/src/components/ContentTags.astro'), 'utf8')
assert.match(component, /data-content-tag/)
assert.match(component, /aria-label="标签"/)
assert.doesNotMatch(component, /<a\b|set:html/)
const topicRoutes = await readFile(resolve(root, 'apps/web/src/pages/topics/[id].astro'), 'utf8')
assert.doesNotMatch(topicRoutes, /\.tags\b/, 'Open tags must not create or populate Topic routes')
console.log('Open-tag search, normalization, legacy isolation and topic-only discovery contracts passed')
