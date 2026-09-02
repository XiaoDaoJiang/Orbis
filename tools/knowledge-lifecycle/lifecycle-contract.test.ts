import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const helperPath = resolve('tools/knowledge-lifecycle/lifecycle.ts')
assert.equal(existsSync(helperPath), true, 'Knowledge lifecycle helper must exist')

const lifecycle = await import(pathToFileURL(helperPath).href)
assert.equal(typeof lifecycle.evaluateReviewHealth, 'function')

const today = '2026-09-02'

assert.deepEqual(
  lifecycle.evaluateReviewHealth({ status: 'active', today }),
  { status: 'active', reviewHealth: 'current', daysUntilReview: null },
)

assert.deepEqual(
  lifecycle.evaluateReviewHealth({ status: 'active', reviewAt: '2026-09-17', today }),
  { status: 'active', reviewHealth: 'current', daysUntilReview: 15 },
)

assert.deepEqual(
  lifecycle.evaluateReviewHealth({ status: 'active', reviewAt: '2026-09-16', today }),
  { status: 'active', reviewHealth: 'due-soon', daysUntilReview: 14 },
)

assert.deepEqual(
  lifecycle.evaluateReviewHealth({ status: 'active', reviewAt: '2026-09-02', today }),
  { status: 'active', reviewHealth: 'due-soon', daysUntilReview: 0 },
)

assert.deepEqual(
  lifecycle.evaluateReviewHealth({ status: 'active', reviewAt: '2026-09-01', today }),
  { status: 'active', reviewHealth: 'overdue', daysUntilReview: -1 },
)

assert.deepEqual(
  lifecycle.evaluateReviewHealth({ status: 'needs-review', reviewAt: '2026-12-01', today }),
  { status: 'needs-review', reviewHealth: 'current', daysUntilReview: 90 },
  'Persisted editorial state must remain independent from derived review health',
)

assert.deepEqual(
  lifecycle.evaluateReviewHealth({ status: 'active', reviewAt: '2028-02-29', today: '2028-02-28' }),
  { status: 'active', reviewHealth: 'due-soon', daysUntilReview: 1 },
)

console.log('Knowledge lifecycle evaluator contract passed')
