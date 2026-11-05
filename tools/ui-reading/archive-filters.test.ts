import assert from 'node:assert/strict'
import { emptyArchiveFilters, matchesArchiveFilters, normalizeArchiveFilters, readArchiveFilters, writeArchiveFilters } from '../../apps/web/src/lib/archive-filters.ts'

const topics = ['all', 'agent-harness', 'coding-agent']
const daily = { kind: 'brief', cadence: 'daily', topics: ['agent-harness'], text: 'Agent 基础设施与可靠执行' }
assert.equal(matchesArchiveFilters(daily, emptyArchiveFilters), true)
assert.equal(matchesArchiveFilters(daily, { ...emptyArchiveFilters, query: 'ＡＧＥＮＴ 可靠' }), true)
assert.equal(matchesArchiveFilters(daily, { ...emptyArchiveFilters, query: 'missing' }), false)
assert.equal(matchesArchiveFilters(daily, { ...emptyArchiveFilters, kind: 'essay' }), false)
assert.equal(matchesArchiveFilters(daily, { ...emptyArchiveFilters, cadence: 'weekly' }), false)
assert.equal(matchesArchiveFilters(daily, { ...emptyArchiveFilters, topic: 'coding-agent' }), false)
assert.deepEqual(normalizeArchiveFilters({ query: '  Agent  ', kind: 'essay', cadence: 'weekly', topic: 'agent-harness' }, topics), {
  query: 'Agent', kind: 'essay', cadence: 'all', topic: 'agent-harness',
})
assert.deepEqual(readArchiveFilters(new URLSearchParams('type=unknown&cadence=invalid&topic=not-a-topic'), topics), emptyArchiveFilters)
const filters = { query: 'Agent 可靠', kind: 'brief', cadence: 'daily', topic: 'agent-harness' }
const written = writeArchiveFilters(new URLSearchParams('utm_source=rss'), filters)
assert.deepEqual(readArchiveFilters(written, topics), filters)
assert.equal(written.get('utm_source'), 'rss')
const literalAll = { ...emptyArchiveFilters, query: 'all' }
assert.equal(writeArchiveFilters(new URLSearchParams(), literalAll).get('q'), 'all')
assert.deepEqual(readArchiveFilters(writeArchiveFilters(new URLSearchParams(), literalAll), topics), literalAll)
assert.equal(writeArchiveFilters(written, emptyArchiveFilters).toString(), 'utm_source=rss')
assert.equal(readArchiveFilters(new URLSearchParams('type=knowledge&cadence=daily'), topics).cadence, 'all')
console.log('Archive filtering, normalization, empty states and URL round-trips passed')
