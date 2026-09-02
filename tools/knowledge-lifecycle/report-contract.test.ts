import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const reportPath = resolve('tools/knowledge-lifecycle/report.ts')
assert.equal(existsSync(reportPath), true, 'Knowledge review report helper must exist')

const reportModule = await import(pathToFileURL(reportPath).href)
assert.equal(typeof reportModule.buildKnowledgeReviewReport, 'function')

const report = reportModule.buildKnowledgeReviewReport([
  { id: 'current', status: 'active', reviewAt: '2026-10-01' },
  { id: 'due', status: 'active', reviewAt: '2026-09-10' },
  { id: 'overdue', status: 'active', reviewAt: '2026-09-01' },
  { id: 'editorial', status: 'needs-review', reviewAt: '2026-12-01' },
  { id: 'unscheduled', status: 'active' },
], '2026-09-02')

assert.equal(report.evaluationDate, '2026-09-02')
assert.deepEqual(report.summary, {
  current: 3,
  dueSoon: 1,
  overdue: 1,
  needsReview: 1,
})

assert.equal(report.entries.find((entry: { id: string }) => entry.id === 'overdue')?.severity, 'WARN')
assert.equal(report.entries.find((entry: { id: string }) => entry.id === 'due')?.severity, 'INFO')
assert.equal(report.entries.find((entry: { id: string }) => entry.id === 'editorial')?.status, 'needs-review')

assert.doesNotThrow(
  () => reportModule.assertReportIsPublishable(report),
  'Overdue or needs-review entries must not fail publishing by themselves',
)

console.log('Knowledge review report contract passed')
