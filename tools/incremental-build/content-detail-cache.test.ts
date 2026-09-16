import assert from 'node:assert/strict'
import {
  getRelatedContentSnapshot,
  type AdjacentContent,
  type DiscoveryItem,
} from '../../apps/web/src/lib/content-discovery.ts'
import {
  adjacentContentCacheIdentity,
  buildContentPageCacheKey,
  selectEntriesById,
} from '../../apps/web/src/lib/incremental-cache.ts'

function item(
  id: string,
  kind: DiscoveryItem['kind'],
  publishedAt: string,
  topics = ['agent-harness'],
): DiscoveryItem {
  return {
    id,
    kind,
    title: `Title ${id}`,
    summary: `Summary ${id}`,
    publishedAt,
    topics,
    href: `/${kind}/${id}/`,
  }
}

const current = item('2026-09-11', 'brief', '2026-09-11')
const older = [
  item('essay-old', 'essay', '2026-09-08'),
  item('knowledge-old', 'knowledge', '2026-09-10'),
]
const sameDay = item('essay-same-day', 'essay', '2026-09-11')
const future = item('2026-09-12', 'brief', '2026-09-12')

const relatedBeforeFuturePublish = getRelatedContentSnapshot(current, [current, ...older, sameDay])
const relatedAfterFuturePublish = getRelatedContentSnapshot(current, [current, ...older, sameDay, future])

assert.deepEqual(
  relatedBeforeFuturePublish.map((candidate) => candidate.id),
  ['knowledge-old', 'essay-old'],
  'detail-page discovery snapshots should only contain earlier publications',
)
assert.deepEqual(
  relatedAfterFuturePublish,
  relatedBeforeFuturePublish,
  'publishing future content must not retroactively change historical related content',
)

const sourceA = { id: 'source-a', digest: 'source-a-v1' }
const sourceB = { id: 'source-b', digest: 'source-b-v1' }
const selectedSources = selectEntriesById([sourceA, sourceB], ['source-a'], 'source')
const entry = { id: current.id, digest: 'brief-v1' }
const previous = item('2026-09-10', 'brief', '2026-09-10')
const adjacency: AdjacentContent = { previous }

function briefKey({
  sources = selectedSources,
  adjacent = adjacency,
  related = relatedBeforeFuturePublish,
}: {
  sources?: { id: string; digest: string }[]
  adjacent?: AdjacentContent
  related?: DiscoveryItem[]
} = {}) {
  return buildContentPageCacheKey({
    scope: 'brief',
    entry,
    dependencyGroups: [{ name: 'sources', entries: sources }],
    related,
    extra: { adjacent: adjacentContentCacheIdentity(adjacent) },
  })
}

const baseline = briefKey()
const selectedAfterUnrelatedSourceChange = selectEntriesById(
  [sourceA, { ...sourceB, digest: 'source-b-v2' }],
  ['source-a'],
  'source',
)
assert.equal(
  briefKey({ sources: selectedAfterUnrelatedSourceChange }),
  baseline,
  'unreferenced Source changes must not invalidate a Brief detail page',
)
assert.notEqual(
  briefKey({ sources: [{ ...sourceA, digest: 'source-a-v2' }] }),
  baseline,
  'referenced Source changes must invalidate the Brief detail page',
)
assert.equal(
  briefKey({ related: relatedAfterFuturePublish }),
  baseline,
  'future publications must not change the detail-page cache key through Related Content',
)
assert.notEqual(
  briefKey({ adjacent: { previous, next: future } }),
  baseline,
  'a newly adjacent Daily must invalidate the local previous Daily page',
)
assert.notEqual(
  briefKey({ adjacent: { previous: { ...previous, title: 'Updated previous title' } } }),
  baseline,
  'rendered adjacency field changes must invalidate the page',
)

console.log('Content detail incremental cache contracts passed')
