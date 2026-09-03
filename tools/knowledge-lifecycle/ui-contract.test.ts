import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const adapterPath = resolve(root, 'apps/web/src/lib/knowledge-lifecycle.ts')

try {
  await access(adapterPath)
} catch {
  assert.fail('Knowledge lifecycle Web adapter must exist')
}

const lifecycle = await import('../../apps/web/src/lib/knowledge-lifecycle.ts')
assert.equal(typeof lifecycle.buildKnowledgeLifecycleViews, 'function', 'buildKnowledgeLifecycleViews must be exported')
assert.equal(typeof lifecycle.isKnowledgeAddressable, 'function', 'isKnowledgeAddressable must be exported')
assert.equal(typeof lifecycle.resolveKnowledgeEvaluationDate, 'function', 'resolveKnowledgeEvaluationDate must be exported')

const today = '2026-09-02'
const entries = [
  { id: 'current', status: 'active', reviewAt: '2026-09-20' },
  { id: 'due-soon', status: 'active', reviewAt: '2026-09-16' },
  { id: 'overdue', status: 'active', reviewAt: '2026-09-01' },
  { id: 'needs-review', status: 'needs-review', reviewAt: '2026-11-01' },
  { id: 'archived-old', status: 'archived', reviewAt: '2026-01-01', supersededBy: 'replacement' },
  { id: 'replacement', status: 'active', reviewAt: '2026-12-01' },
  { id: 'draft', status: 'draft', reviewAt: '2026-12-01' },
] as const

const views = lifecycle.buildKnowledgeLifecycleViews(entries, today)
const byId = new Map(views.map((view: { id: string }) => [view.id, view]))

assert.equal(byId.get('current')?.reviewHealth, 'current')
assert.equal(byId.get('due-soon')?.reviewHealth, 'due-soon')
assert.equal(byId.get('due-soon')?.daysUntilReview, 14)
assert.equal(byId.get('overdue')?.reviewHealth, 'overdue')
assert.equal(byId.get('overdue')?.daysUntilReview, -1)
assert.equal(byId.get('needs-review')?.status, 'needs-review', 'editorial state must remain explicit')
assert.equal(byId.get('needs-review')?.reviewHealth, 'current', 'needs-review must not imply overdue')
assert.equal(byId.get('archived-old')?.addressable, true)
assert.equal(byId.get('archived-old')?.currentDiscovery, false)
assert.equal(byId.get('needs-review')?.addressable, true)
assert.equal(byId.get('needs-review')?.currentDiscovery, false)
assert.equal(byId.get('draft')?.addressable, false)
assert.equal(byId.get('replacement')?.currentDiscovery, true)
assert.equal(byId.get('archived-old')?.replacementId, 'replacement')
assert.deepEqual(byId.get('replacement')?.supersedes, ['archived-old'])
assert.deepEqual(byId.get('current')?.supersedes, [])

assert.equal(lifecycle.isKnowledgeAddressable('published'), true)
assert.equal(lifecycle.isKnowledgeAddressable('active'), true)
assert.equal(lifecycle.isKnowledgeAddressable('needs-review'), true)
assert.equal(lifecycle.isKnowledgeAddressable('archived'), true)
assert.equal(lifecycle.isKnowledgeAddressable('draft'), false)

assert.equal(lifecycle.resolveKnowledgeEvaluationDate('2026-02-29'), '2026-02-29', 'valid leap date must be accepted')
assert.throws(() => lifecycle.resolveKnowledgeEvaluationDate('2026-02-30'), /Invalid calendar date/)

console.log('Knowledge lifecycle Web adapter contract passed')
